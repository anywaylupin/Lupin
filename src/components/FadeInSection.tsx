import React, { useEffect, useRef, useState } from 'react';

interface Props {
    delay?: string;
    children: React.ReactNode;
}

const FadeInSection: React.FC<Props> = ({ delay, children }) => {
    const [isVisible, setVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setVisible(entry.isIntersecting);
                }
            });
        });

        if (domRef.current) {
            observer.observe(domRef.current);
        }

        return () => {
            const { current } = domRef;
            current && observer.unobserve(current);
        };
    }, []);

    return (
        <div
            className={`fade-in-section ${isVisible ? 'is-visible' : ''}`}
            style={{ transitionDelay: `${delay || 0}` }}
            ref={domRef}>
            {children}
        </div>
    );
};

export default FadeInSection;
