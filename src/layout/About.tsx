/**
 * Represents the About component.
 *
 * @component
 */
import React from 'react';
import { FadeInSection } from '../components';

/**
 * State of the About component.
 */
interface State {
    expanded: boolean;
    activeKey: string;
}

/**
 * About component.
 *
 * @component
 */
const About: React.FC = () => {
    const [expanded, setExpanded] = React.useState(true);
    const [activeKey, setActiveKey] = React.useState('1');

    const handleSelect = (eventKey: string) => {
        setActiveKey(eventKey);
    };

    const one = (
        <p>
            I am currently a <b>Interactive Front End Developer</b> at{' '}
            <a href='https://totallyawesome.tv/'>Totally Awesome</a>.
        </p>
    );
    const two = (
        <p>
            Outside of work, I'm interested in following the developments of science. I also play a lot of video games.
        </p>
    );
    const tech_stack = ['Javascript ES6+', 'Python', 'React.js', 'Node.js', 'HTML & CSS'];

    const tech_items = tech_stack.map((stack, index) => <li key={index}>{stack}</li>);

    return (
        <section id='about'>
            <FadeInSection>
                <div className='section-header'>
                    <span className='section-title'>/ about me</span>
                </div>
                <div className='about-content'>
                    <div className='about-description'>
                        {one}
                        Here are some technologies I have been working with:
                        <ul className='tech-stack'>
                            {tech_stack.map((tech_item, i) => (
                                <FadeInSection key={i} delay={`${i + 1}00ms`}>
                                    <li>{tech_item}</li>
                                </FadeInSection>
                            ))}
                        </ul>
                        {two}
                    </div>
                    <div className='about-image'>
                        <img src='/assets/me.jpg' alt='Me' />
                    </div>
                </div>
            </FadeInSection>
        </section>
    );
};

export default About;
