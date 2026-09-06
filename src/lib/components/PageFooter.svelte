<script>
    import tooltip from "@/actions/tooltip";
</script>

<footer class="page-footer">
    <div class="wrapper wrapper-lg">
        <div class="primary-bar">
            <nav class="footer-col links">
                <a href="/faq" class="link-item">FAQ</a>
                <a
                    href={import.meta.env.PB_DISCUSSIONS_URL}
                    class="link-item"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Discussions
                </a>
                <a href="/docs" class="link-item">Documentation</a>
            </nav>

            <nav class="footer-col links">
                <a
                    href={import.meta.env.PB_JS_SDK_URL}
                    class="link-item"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    JavaScript SDK
                </a>
                <a
                    href={import.meta.env.PB_DART_SDK_URL}
                    class="link-item"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Dart SDK
                </a>
            </nav>

            <div class="footer-col socials">
                <div class="watermark-logo">void<strong>base</strong></div>
                <a
                    href="https://github.com/voidbase-cloud"
                    rel="noopener noreferrer"
                    target="_blank"
                    class="btn btn-secondary btn-circle btn-hint social-item"
                    aria-label="voidbase on GitHub"
                    use:tooltip={{ text: "The voidbase-cloud organization", position: "top" }}
                >
                    <i class="ri-community-line" />
                </a>
                <a
                    href={import.meta.env.PB_REPO_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                    class="btn btn-secondary btn-circle btn-hint social-item"
                    aria-label="Go to GitHub"
                    use:tooltip={{ text: "Go to GitHub", position: "top" }}
                >
                    <i class="ri-github-line" />
                </a>
            </div>
        </div>
        <div class="credits-bar">
            <span class="txt">
                void<strong>base</strong> is an independent project, not affiliated with or endorsed by PocketBase.
            </span>
            <span class="txt">
                It runs
                <a href="https://pocketbase.io" target="_blank" rel="noopener noreferrer">PocketBase</a>'s API and admin
                panel and is built on
                <a href="https://void.cloud" target="_blank" rel="noopener noreferrer">Void</a>'s Cloudflare runtime; the two
                power most of what runs here and keep shipping the updates voidbase builds on.
            </span>
        </div>
        <div class="secondary-bar">
            <div class="terms">
                <span class="txt">
                    © {new Date().getFullYear()} void<strong>base</strong>
                </span>
                <span class="gopher-credit">
                    The Gopher artwork is from
                    <a
                        href="https://github.com/marcusolsson/gophers"
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        marcusolsson/gophers
                    </a>
                </span>
            </div>
            <div class="flex-fill" />
            <div class="credit">
                Site design by <a
                    href="https://gani.bg"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link-hint"
                >
                    <strong>Gani</strong>
                </a> (PocketBase)
            </div>
        </div>
    </div>
</footer>
