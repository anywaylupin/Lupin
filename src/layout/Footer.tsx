import React from 'react';

interface State {
    expanded: boolean;
    activeKey: string;
}

class Footer extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {
            expanded: true,
            activeKey: '1',
        };
        this.handleSelect = this.handleSelect.bind(this);
    }

    handleSelect(eventKey: string) {
        this.setState({
            activeKey: eventKey,
        });
    }

    render() {
        return <footer id='footer' className='footer'></footer>;
    }
}

export default Footer;
