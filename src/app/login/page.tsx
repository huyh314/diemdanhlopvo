import { login } from './actions';
import SubmitButton from './SubmitButton';
import MessageDisplay from './MessageDisplay';

export default function LoginPage() {

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 font-sans text-[var(--text-primary)] relative overflow-hidden">
            {/* Aurora Background */}
            <div className="aurora-bg" />
            <div className="aurora-blob" />

            {/* Grid pattern overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(var(--accent-rgb-from), 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb-from), 0.02) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                    opacity: 0.5,
                }}
            />

            {/* Login Card */}
            <div className="relative z-10 max-w-md w-full animate-modal-in">
                <div className="glass rounded-3xl p-8 md:p-10 border border-[var(--glass-border)] shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                    {/* Logo & Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] flex items-center justify-center shadow-[0_8px_25px_rgba(var(--accent-rgb-from),0.4)]">
                            <span className="text-3xl">🥋</span>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent-from)] via-white to-[var(--accent-to)] bg-clip-text text-transparent">
                            Võ Đường Manager
                        </h1>
                        <p className="text-[var(--text-tertiary)] mt-2 text-sm font-medium">
                            Đăng nhập tài khoản quản lý
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-5">
                        <div className="space-y-1.5">
                            <label
                                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
                                htmlFor="email"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-3.5 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-from)] focus:ring-4 focus:ring-[rgba(var(--accent-rgb-from),0.1)] transition-all duration-300 text-sm"
                                placeholder="admin@voduong.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
                                htmlFor="password"
                            >
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-3.5 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-from)] focus:ring-4 focus:ring-[rgba(var(--accent-rgb-from),0.1)] transition-all duration-300 text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-2">
                            <SubmitButton
                                formAction={login}
                                className="w-full bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-white shadow-[0_4px_20px_rgba(var(--accent-rgb-from),0.4)] hover:shadow-[0_8px_30px_rgba(var(--accent-rgb-from),0.6)] hover:brightness-110"
                            >
                                🔐 Đăng Nhập
                            </SubmitButton>
                        </div>

                        {/* Error message */}
                        <MessageDisplay />
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-5 border-t border-[var(--border-secondary)] text-center">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)] font-medium">
                            Hệ thống quản lý điểm danh & thi đua
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
