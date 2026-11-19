
import { useState } from 'react'
import { supabase } from '../../supabase'

function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (isRegister && !name.trim()) {
      setMessage('Lütfen adınızı girin.')
      return
    }

    if (password.length < 6) {
      setMessage('Şifre en az 6 karakter olmalıdır.')
      return
    }

    setLoading(true)

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        })

        if (error) throw error

        setMessage('Kayıt başarılı! E-posta adresinizi doğrulayın.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">✓</div>

        <h1>TaskFlow</h1>
        <p className="auth-subtitle">
          {isRegister
            ? 'Yeni hesabını oluştur'
            : 'Hesabına hoş geldin'}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              placeholder="Ad Soyad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="E-posta adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Şifre (en az 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {message && (
            <p className="auth-message">{message}</p>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? 'Lütfen bekleyin...'
              : isRegister
                ? 'Kayıt Ol'
                : 'Giriş Yap'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister
            ? 'Zaten hesabın var mı?'
            : 'Henüz hesabın yok mu?'}

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setMessage('')
            }}
          >
            {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
