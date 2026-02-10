import React from 'react';
import { motion } from 'framer-motion';

const WelcomeScreen = ({ onComplete }) => {
    return (
        <motion.div
            className="welcome-container"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            onAnimationComplete={onComplete}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'black',
                textAlign: 'center',
                padding: '2rem'
            }}
        >
            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', color: '#888', marginBottom: '1rem', letterSpacing: '2px' }}
            >
                WELCOME
            </motion.h1>

            <motion.h2
                className="gradient-text"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                style={{
                    fontSize: 'clamp(2rem, 8vw, 6rem)',
                    fontWeight: 'bold',
                    marginBottom: '3rem',
                    lineHeight: 1.2
                }}
            >
                Falcon Agrifriz Foods <br /> Private Limited
            </motion.h2>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3, duration: 0.8 }}
                style={{
                    marginTop: 'auto',
                    marginBottom: '4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <p style={{ color: '#aaa', fontSize: '1.2rem', marginBottom: '1rem' }}>Proudly Presented By</p>

                {/* Animated Logo */}
                <motion.img
                    src="https://media.licdn.com/dms/image/v2/C4D0BAQE20hVhm7aPTg/company-logo_200_200/company-logo_200_200/0/1660820147946/crystal_logistic_cool_chain_ltd_logo?e=2147483647&v=beta&t=uw2hvnM_RjKKC4mIvy6S6jmOMsKg6UEDdVXZXubTjps"
                    alt="Crystal Group"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 3.2, type: "spring", stiffness: 100 }}
                    style={{
                        width: 'clamp(120px, 15vw, 250px)',
                        height: 'clamp(120px, 15vw, 250px)',
                        borderRadius: '50%',
                        border: '4px solid white',
                        marginBottom: '1rem',
                        backgroundColor: 'white' // Ensure logo has white bg if it's transparent/dark
                    }}
                />

                <h3 style={{ fontSize: '2rem', color: 'white', letterSpacing: '4px', textTransform: 'uppercase' }}>
                    Crystal Group
                </h3>
                <p style={{ color: 'var(--primary)', marginTop: '0.5rem' }}>Welcomes You</p>
            </motion.div>
        </motion.div>
    );
};

export default WelcomeScreen;
