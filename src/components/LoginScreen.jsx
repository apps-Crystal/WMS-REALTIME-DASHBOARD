import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { jwtDecode } from "jwt-decode";

const LoginScreen = ({ onLoginSuccess }) => {
    const [loginError, setLoginError] = React.useState(null);

    const handleGoogleSuccess = (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);

            // Domain Restriction Check
            if (decoded.email && decoded.email.endsWith('@crystalgroup.in')) {
                setLoginError(null);
                onLoginSuccess({
                    name: decoded.name,
                    email: decoded.email,
                    picture: decoded.picture,
                    sub: decoded.sub
                });
            } else {
                setLoginError("Access Denied: Only @crystalgroup.in emails are authorized.");
                console.warn("Unauthorized login attempt:", decoded.email);
            }
        } catch (error) {
            console.error("Login Failed:", error);
            setLoginError("Login process failed. Please try again.");
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #000 100%)',
            color: 'white',
            position: 'relative',
            zIndex: 100
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="glass-panel"
                style={{
                    padding: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2rem',
                    maxWidth: '400px',
                    width: '90%'
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <img
                        src="https://media.licdn.com/dms/image/v2/C4D0BAQE20hVhm7aPTg/company-logo_200_200/company-logo_200_200/0/1660820147946/crystal_logistic_cool_chain_ltd_logo?e=2147483647&v=beta&t=uw2hvnM_RjKKC4mIvy6S6jmOMsKg6UEDdVXZXubTjps"
                        alt="Crystal Logo"
                        style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem', border: '2px solid rgba(255,255,255,0.2)' }}
                    />
                    <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Pro Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Sign in to access vehicle entries</p>
                </div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    {/* Custom Simulation Button (Since actual Client ID is pending) */}
                    <button
                        onClick={() => {
                            // Direct bypass for permitted user
                            onLoginSuccess({
                                name: "Falcon App",
                                email: "apps@crystalgroup.in",
                                picture: "",
                                sub: "auth-bypass-123"
                            });
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            background: 'white',
                            color: '#3c4043',
                            border: '1px solid #dadce0',
                            borderRadius: '20px',
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            fontFamily: "'Google Sans', arial, sans-serif",
                            cursor: 'pointer',
                            width: '100%',
                            maxWidth: '300px',
                            transition: 'background 0.2s',
                            outline: 'none',
                            height: '40px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#f7f8f8'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    >
                        {/* Google G Logo SVG */}
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48">
                            <g>
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            </g>
                        </svg>
                        Sign in with Google
                    </button>

                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', textAlign: 'center' }}>
                        Simulation Mode for: <span style={{ color: '#fff' }}>apps@crystalgroup.in</span>
                    </div>

                    {loginError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                color: '#ff4d4d',
                                background: 'rgba(255, 77, 77, 0.1)',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 77, 77, 0.2)',
                                fontSize: '0.8rem',
                                textAlign: 'center'
                            }}
                        >
                            {loginError}
                        </motion.div>
                    )}
                </div>

                <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '1rem' }}>
                    Restricted Access • Authorized Personnel Only
                </p>
            </motion.div>
        </div>
    );
};

export default LoginScreen;
