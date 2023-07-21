import React, { useState } from 'react';

interface ToggleButtonProps {
    onToggle: (isDisabled: boolean) => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ onToggle }) => {
    const [isDisabled, setIsDisabled] = useState(false);

    const handleToggle = () => {
        const newState = !isDisabled;
        setIsDisabled(newState);
        onToggle(newState);
    };

    return (
        <button className={isDisabled ? 'toggle-button disabled' : 'toggle-button'} onClick={handleToggle}>
            {isDisabled ? 'Enable Effects' : 'Disable Effects'}
        </button>
    );
};

export default ToggleButton;
