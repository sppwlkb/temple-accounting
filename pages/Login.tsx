import { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseClient';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On successful login, the onAuthStateChanged listener in App.tsx will handle the state update.
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f1f5f9' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', width: '350px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>廣清弘道功德會</h1>
        <p style={{ textAlign: 'center', color: '#64748b' }}>會計管理系統登入</p>
        <input
          type="email"
          placeholder="電子郵件"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="password"
          placeholder="密碼"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.75rem', cursor: 'pointer', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          {loading ? '登入中...' : '登入'}
        </button>
      </form>
    </div>
  );
}