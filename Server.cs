#pragma warning disable 4014
using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace CollegeSeekers
{
    public class StaticServer
    {
        private class CacheEntry
        {
            public byte[] Bytes;
            public DateTime LastWrite;
        }

        private TcpListener _listenerV4;
        private TcpListener _listenerV6;
        private string _rootDir;
        private volatile bool _running;
        private ConcurrentDictionary<string, CacheEntry> _fileCache = new ConcurrentDictionary<string, CacheEntry>(StringComparer.OrdinalIgnoreCase);
        
        private static readonly Dictionary<string, string> Mimes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { ".html", "text/html; charset=utf-8" },
            { ".htm", "text/html; charset=utf-8" },
            { ".css", "text/css; charset=utf-8" },
            { ".js", "application/javascript; charset=utf-8" },
            { ".mjs", "application/javascript; charset=utf-8" },
            { ".json", "application/json; charset=utf-8" },
            { ".svg", "image/svg+xml" },
            { ".png", "image/png" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".gif", "image/gif" },
            { ".webp", "image/webp" },
            { ".ico", "image/x-icon" },
            { ".woff", "font/woff" },
            { ".woff2", "font/woff2" },
            { ".ttf", "font/ttf" },
            { ".otf", "font/otf" },
            { ".txt", "text/plain; charset=utf-8" },
            { ".map", "application/json; charset=utf-8" }
        };

        public StaticServer(string rootDir)
        {
            _rootDir = Path.GetFullPath(rootDir);
            PreloadFiles();
        }

        private void PreloadFiles()
        {
            if (Directory.Exists(_rootDir))
            {
                foreach (string file in Directory.GetFiles(_rootDir, "*.*", SearchOption.AllDirectories))
                {
                    try
                    {
                        string rel = file.Substring(_rootDir.Length).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar).Replace('\\', '/');
                        _fileCache["/" + rel] = new CacheEntry
                        {
                            Bytes = File.ReadAllBytes(file),
                            LastWrite = File.GetLastWriteTimeUtc(file)
                        };
                    }
                    catch { }
                }
            }
        }

        public void Start(int port)
        {
            _running = true;

            // Start IPv4 listener on 0.0.0.0 (All interfaces)
            try
            {
                _listenerV4 = new TcpListener(IPAddress.Any, port);
                _listenerV4.Server.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
                _listenerV4.Start(100);
                ThreadPool.QueueUserWorkItem(state => AcceptLoop(_listenerV4));
            }
            catch (Exception ex)
            {
                Console.WriteLine("IPv4 start error: " + ex.Message);
                throw;
            }

            // Attempt IPv6 listener on [::] (All IPv6 interfaces)
            try
            {
                _listenerV6 = new TcpListener(IPAddress.IPv6Any, port);
                _listenerV6.Server.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
                _listenerV6.Start(100);
                ThreadPool.QueueUserWorkItem(state => AcceptLoop(_listenerV6));
            }
            catch { }
        }

        public void Stop()
        {
            _running = false;
            try
            {
                if (_listenerV4 != null) _listenerV4.Stop();
            }
            catch { }
            try
            {
                if (_listenerV6 != null) _listenerV6.Stop();
            }
            catch { }
        }

        private void AcceptLoop(TcpListener listener)
        {
            while (_running)
            {
                try
                {
                    TcpClient client = listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(state => {
                        try
                        {
                            HandleClient((TcpClient)state).Wait();
                        }
                        catch { }
                    }, client);
                }
                catch
                {
                    if (!_running) break;
                }
            }
        }

        private async Task HandleClient(TcpClient client)
        {
            using (client)
            {
                client.NoDelay = true;
                client.ReceiveTimeout = 8000;
                client.SendTimeout = 8000;

                using (NetworkStream stream = client.GetStream())
                {
                    byte[] buffer = new byte[8192];
                    
                    while (_running && client.Connected)
                    {
                        int bytesRead = 0;
                        try
                        {
                            bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length);
                        }
                        catch
                        {
                            break;
                        }

                        if (bytesRead <= 0) break;

                        string rawRequest = Encoding.ASCII.GetString(buffer, 0, bytesRead);
                        int lineEnd = rawRequest.IndexOf("\r\n");
                        if (lineEnd == -1) lineEnd = rawRequest.IndexOf("\n");
                        if (lineEnd == -1) break;

                        string reqLine = rawRequest.Substring(0, lineEnd);
                        string[] parts = reqLine.Split(' ');
                        if (parts.Length < 2) break;

                        string method = parts[0].ToUpperInvariant();
                        string rawPath = parts[1];

                        // Strip query string
                        int queryIdx = rawPath.IndexOf('?');
                        if (queryIdx >= 0) rawPath = rawPath.Substring(0, queryIdx);

                        // Decode URL
                        string path = Uri.UnescapeDataString(rawPath);
                        if (string.IsNullOrEmpty(path) || path == "/")
                        {
                            path = "/index.html";
                        }

                        bool keepAlive = !rawRequest.Contains("Connection: close");

                        if (method == "OPTIONS")
                        {
                            byte[] optResp = Encoding.UTF8.GetBytes(
                                "HTTP/1.1 204 No Content\r\n" +
                                "Server: CollegeSeekers-HyperEngine/2.0\r\n" +
                                "Access-Control-Allow-Origin: *\r\n" +
                                "Access-Control-Allow-Methods: GET, POST, HEAD, OPTIONS\r\n" +
                                "Access-Control-Allow-Headers: *\r\n" +
                                "Connection: " + (keepAlive ? "keep-alive" : "close") + "\r\n" +
                                "\r\n"
                            );
                            await stream.WriteAsync(optResp, 0, optResp.Length);
                            if (!keepAlive) break;
                            continue;
                        }

                        // Resolve file
                        string ext = Path.GetExtension(path);
                        string localPath = Path.Combine(_rootDir, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                        
                        // Traversal guard
                        try
                        {
                            string fullLocal = Path.GetFullPath(localPath);
                            if (!fullLocal.StartsWith(_rootDir, StringComparison.OrdinalIgnoreCase))
                            {
                                Send404(stream, path, keepAlive);
                                if (!keepAlive) break;
                                continue;
                            }
                        }
                        catch
                        {
                            Send404(stream, path, keepAlive);
                            if (!keepAlive) break;
                            continue;
                        }

                        byte[] data = null;
                        CacheEntry entry;
                        if (File.Exists(localPath))
                        {
                            DateTime diskWrite = File.GetLastWriteTimeUtc(localPath);
                            if (_fileCache.TryGetValue(path, out entry) && entry.LastWrite == diskWrite)
                            {
                                data = entry.Bytes;
                            }
                            else
                            {
                                try
                                {
                                    data = File.ReadAllBytes(localPath);
                                    _fileCache[path] = new CacheEntry { Bytes = data, LastWrite = diskWrite };
                                }
                                catch
                                {
                                    if (entry != null) data = entry.Bytes;
                                }
                            }
                        }
                        else if (_fileCache.TryGetValue(path, out entry))
                        {
                            data = entry.Bytes;
                        }

                        if (data != null)
                        {
                            string mime;
                            if (!Mimes.TryGetValue(ext, out mime))
                            {
                                mime = "application/octet-stream";
                            }

                            string cacheControl = (ext.Equals(".html", StringComparison.OrdinalIgnoreCase) || ext.Equals(".js", StringComparison.OrdinalIgnoreCase) || ext.Equals(".css", StringComparison.OrdinalIgnoreCase))
                                ? "no-cache, no-store, must-revalidate" 
                                : "public, max-age=3600, immutable";

                            StringBuilder sb = new StringBuilder();
                            sb.Append("HTTP/1.1 200 OK\r\n");
                            sb.Append("Server: CollegeSeekers-HyperEngine/2.0\r\n");
                            sb.Append("Date: ").Append(DateTime.UtcNow.ToString("R")).Append("\r\n");
                            sb.Append("Content-Type: ").Append(mime).Append("\r\n");
                            sb.Append("Content-Length: ").Append(data.Length).Append("\r\n");
                            sb.Append("Access-Control-Allow-Origin: *\r\n");
                            sb.Append("Access-Control-Allow-Methods: GET, POST, HEAD, OPTIONS\r\n");
                            sb.Append("Access-Control-Allow-Headers: *\r\n");
                            sb.Append("Cache-Control: ").Append(cacheControl).Append("\r\n");
                            sb.Append("Connection: ").Append(keepAlive ? "keep-alive" : "close").Append("\r\n");
                            sb.Append("\r\n");

                            byte[] headerBytes = Encoding.UTF8.GetBytes(sb.ToString());
                            await stream.WriteAsync(headerBytes, 0, headerBytes.Length);

                            if (method != "HEAD")
                            {
                                await stream.WriteAsync(data, 0, data.Length);
                            }
                        }
                        else
                        {
                            Send404(stream, path, keepAlive);
                        }

                        await stream.FlushAsync();
                        if (!keepAlive) break;
                    }
                }
            }
        }

        private void Send404(NetworkStream stream, string path, bool keepAlive)
        {
            try
            {
                byte[] body = Encoding.UTF8.GetBytes("404 Not Found: " + path);
                string head = "HTTP/1.1 404 Not Found\r\n" +
                              "Server: CollegeSeekers-HyperEngine/2.0\r\n" +
                              "Content-Type: text/plain; charset=utf-8\r\n" +
                              "Content-Length: " + body.Length + "\r\n" +
                              "Access-Control-Allow-Origin: *\r\n" +
                              "Connection: " + (keepAlive ? "keep-alive" : "close") + "\r\n" +
                              "\r\n";
                byte[] headBytes = Encoding.UTF8.GetBytes(head);
                stream.Write(headBytes, 0, headBytes.Length);
                stream.Write(body, 0, body.Length);
                stream.Flush();
            }
            catch { }
        }
    }
}
