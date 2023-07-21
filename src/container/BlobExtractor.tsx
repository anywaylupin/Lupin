import React from 'react';
import { Calc } from '../utils';

/**
 * Bubbles component displaying animated bubbles.
 */
const BlobExtractor: React.FC = () => {
    /**
     * Generates random bubble styles.
     * @returns {React.CSSProperties} The generated bubble styles.
     */
    const generateBubbleStyle = (): React.CSSProperties => {
        const size = 2 + Calc.CryptoRandom() * 4;
        const distance = 6 + Calc.CryptoRandom() * 4;
        const position = -5 + Calc.CryptoRandom() * 110;
        const time = 2 + Calc.CryptoRandom() * 4;
        const delay = -1 * (2 + Calc.CryptoRandom() * 2);

        return {
            '--size': `${size}rem`,
            '--distance': `${distance}rem`,
            '--position': `${position}%`,
            '--time': `${time}s`,
            '--delay': `${delay}s`,
        } as React.CSSProperties; // Typecast to React.CSSProperties
    };

    return (
        <>
            <div className='blob-container'>
                <div className='blob-extractor'>
                    {Array.from({ length: 64 }, (_, i) => {
                        const style = generateBubbleStyle();
                        return <div className='blob' style={style} key={i}></div>;
                    })}
                </div>
            </div>
            <svg style={{ display: 'none' }}>
                <defs>
                    <filter id='blob'>
                        <feGaussianBlur in='SourceGraphic' stdDeviation='10' result='blur' />
                        <feColorMatrix
                            in='blur'
                            mode='matrix'
                            values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9'
                            result='blob'
                        />
                    </filter>
                </defs>
            </svg>
        </>
    );
};

export default BlobExtractor;
