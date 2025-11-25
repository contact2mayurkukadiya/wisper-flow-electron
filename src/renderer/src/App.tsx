import { JSX, useEffect, useState } from 'react';
import Settings from './Settings';
import Widget from './Widget';

function App(): JSX.Element {
    // 1. CHECK HASH IMMEDIATELY (Lazy Initializer)
    // Instead of waiting for useEffect, we check logic right now.
    const [route, setRoute] = useState<'widget' | 'settings'>(() => {
        return window.location.hash === '#settings' ? 'settings' : 'widget';
    });


    console.log("App Route:", route);
    useEffect(() => {
        console.log("route changed:", route);
        const handleHashChange = () => {
            console.log("hash changed:", route);
            if (window.location.hash === '#settings') setRoute('settings');
            else setRoute('widget');
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    if (route === 'settings') return <Settings />;
    return <Widget />;
}

export default App;