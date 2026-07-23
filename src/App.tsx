import './App.css'

export default function App() {
  return (
    <main className="app">
      <section className="card">
        <h1 className="title">Hello from Zarlania</h1>
        <p className="subtitle">
          Discover, organize, and manage your collections.
        </p>
        <p className="status" role="status">
          The web application is up and running.
        </p>
      </section>
      <footer className="footer">
        {/*
          Placeholder: this app does not talk to zarlania-api yet. When it does,
          read the base URL from import.meta.env.VITE_ZARLANIA_API_URL (see
          .env.example).
        */}
        <a
          href="https://github.com/Zarlania/zarlania-app"
          target="_blank"
          rel="noreferrer"
        >
          Zarlania on GitHub
        </a>
      </footer>
    </main>
  )
}
