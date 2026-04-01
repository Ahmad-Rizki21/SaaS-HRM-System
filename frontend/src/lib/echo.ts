import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import Cookies from 'js-cookie';

declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

if (typeof window !== 'undefined') {
    window.Pusher = Pusher;

    // Use singleton instance
    if (!window.Echo) {
        window.Echo = new Echo({
            broadcaster: 'reverb',
            key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'vbovvxvpylkuw8p9x3lp', // Fallback for local testing if env is missing
            wsHost: window.location.hostname,
            wsPort: 8080,
            wssPort: 8080,
            forceTLS: false,
            enabledTransports: ['ws', 'wss'],
            authorizer: (channel: any, options: any) => {
                return {
                    authorize: (socketId: string, callback: Function) => {
                        const token = Cookies.get('token');
                        fetch(`http://${window.location.hostname}:8000/api/broadcasting/auth`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                socket_id: socketId,
                                channel_name: channel.name
                            })
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(data => callback(false, data))
                        .catch(error => callback(true, error));
                    }
                };
            },
        });
    }
}

export default typeof window !== 'undefined' ? window.Echo : null;
