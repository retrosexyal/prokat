"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"

export default function RegisterPage() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {

    e.preventDefault()
    setErr("")
    setLoading(true)

    // 1️⃣ создаём пользователя
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      setErr(data.error || "Registration failed")
      setLoading(false)
      return
    }

    // 2️⃣ автологин через next-auth
    const login = await signIn("credentials", {
      email,
      password,
      redirect: false
    })

    if (login?.error) {
      setErr("Created but login failed")
      setLoading(false)
      return
    }

    // 3️⃣ редирект
    window.location.href = "/"
  }

  return (
    <form onSubmit={onSubmit} style={{display:"flex",flexDirection:"column",gap:10,maxWidth:300}}>

      <h2>Регистрация</h2>

      <input
        placeholder="email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
      />

      <button disabled={loading}>
        {loading ? "Creating..." : "Create account"}
      </button>

      {err && <p style={{color:"red"}}>{err}</p>}

    </form>
  )
}
