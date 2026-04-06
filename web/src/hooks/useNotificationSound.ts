import { useCallback, useEffect, useState } from 'react'

const NOTIFICATION_SOUND_KEY = 'hapi-notification-sound-enabled'
const NOTIFICATION_SOUND_URL = '/notification-sound.wav'
const DEFAULT_NOTIFICATION_SOUND_ENABLED = false

function isBrowser(): boolean {
    return typeof window !== 'undefined'
}

function safeGetItem(key: string): string | null {
    if (!isBrowser()) {
        return null
    }
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

function safeSetItem(key: string, value: string): void {
    if (!isBrowser()) {
        return
    }
    try {
        localStorage.setItem(key, value)
    } catch {
        // Ignore storage errors.
    }
}

function safeRemoveItem(key: string): void {
    if (!isBrowser()) {
        return
    }
    try {
        localStorage.removeItem(key)
    } catch {
        // Ignore storage errors.
    }
}

function parseEnabled(raw: string | null): boolean {
    if (raw === 'true') {
        return true
    }
    if (raw === 'false') {
        return false
    }
    return DEFAULT_NOTIFICATION_SOUND_ENABLED
}

export function isNotificationSoundEnabled(): boolean {
    return parseEnabled(safeGetItem(NOTIFICATION_SOUND_KEY))
}

function getNotificationAudio(): HTMLAudioElement | null {
    if (!isBrowser() || typeof Audio === 'undefined') {
        return null
    }

    try {
        const audio = new Audio(NOTIFICATION_SOUND_URL)
        audio.preload = 'auto'
        audio.volume = 1
        return audio
    } catch {
        return null
    }
}

export async function playNotificationSound(): Promise<void> {
    const audio = getNotificationAudio()
    if (!audio) {
        return
    }

    try {
        audio.currentTime = 0
    } catch {
        // Ignore seek errors on a fresh element.
    }

    try {
        await audio.play()
    } catch {
        // Autoplay may be blocked; fail silently.
    }
}

export function useNotificationSound(): {
    notificationSoundEnabled: boolean
    setNotificationSoundEnabled: (enabled: boolean) => void
} {
    const [notificationSoundEnabled, setNotificationSoundEnabledState] = useState<boolean>(isNotificationSoundEnabled)

    useEffect(() => {
        if (!isBrowser()) {
            return
        }

        const onStorage = (event: StorageEvent) => {
            if (event.key !== NOTIFICATION_SOUND_KEY) {
                return
            }
            setNotificationSoundEnabledState(parseEnabled(event.newValue))
        }

        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const setNotificationSoundEnabled = useCallback((enabled: boolean) => {
        setNotificationSoundEnabledState(enabled)

        if (enabled === DEFAULT_NOTIFICATION_SOUND_ENABLED) {
            safeRemoveItem(NOTIFICATION_SOUND_KEY)
            return
        }

        safeSetItem(NOTIFICATION_SOUND_KEY, String(enabled))
    }, [])

    return { notificationSoundEnabled, setNotificationSoundEnabled }
}
