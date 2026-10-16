import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && event === 'PASSWORD_RECOVERY' && session) setReady(true);
    });
    // Supabase may have processed the recovery hash before this component mounted.
    const check = async () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const isRecovery = params.get('type') === 'recovery';
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (mounted && error) setMessage('Reset link is invalid or expired. Request a new link.');
        else if (mounted) setReady(true);
      } else if (isRecovery) {
        const { data, error } = await supabase.auth.getSession();
        if (mounted && data.session && !error) setReady(true);
        else if (mounted) setMessage('Reset link is invalid or expired. Request a new link.');
      } else if (mounted) {
        setMessage('Open the password-reset link sent to your email.');
      }
    };
    void check();
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || loading) return;
    if (password.length < 8) { setMessage('Use at least 8 characters.'); return; }
    if (password !== confirm) { setMessage('Passwords do not match.'); return; }
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage(error.message);
    else {
      setSuccess(true);
      setMessage('Password updated. Please sign in with your new password.');
      await supabase.auth.signOut();
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#FAF4E8] flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white rounded-2xl shadow-xl p-7 space-y-5">
        <h1 className="text-2xl font-bold text-[#23532B]">Reset POS Password</h1>
        <p className="text-sm text-gray-600">Choose a new password for your Kanthaaram POS account.</p>
        {message && <p role="status" className={success ? 'text-emerald-700 text-sm' : 'text-red-600 text-sm'}>{message}</p>}
        {!success && <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">New password
            <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} disabled={!ready || loading} className="mt-1 w-full border rounded-lg p-3" />
          </label>
          <label className="block text-sm font-semibold">Confirm password
            <input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} disabled={!ready || loading} className="mt-1 w-full border rounded-lg p-3" />
          </label>
          <button type="submit" disabled={!ready || loading} className="w-full bg-[#23532B] text-white rounded-lg p-3 disabled:opacity-50">{loading ? 'Updating...' : 'Update Password'}</button>
        </form>}
        <a href="/" className="block text-center text-sm underline text-[#23532B]">Back to Login</a>
      </section>
    </main>
  );
};
