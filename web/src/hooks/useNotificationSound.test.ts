import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { isNotificationSoundEnabled, playNotificationSound } from './useNotificationSound'

const originalLocalStorage = window.localStorage
const originalAudio = globalThis.Audio

describe('useNotificationSound helpers', () => {
    beforeEach(() => {
        const store = new Map<string, string>()
        const localStorageMock = {
            getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
            setItem: vi.fn((key: string, value: string) => {
                store.set(key, value)
            }),
            removeItem: vi.fn((key: string) => {
                store.delete(key)
            }),
            clear: vi.fn(() => {
                store.clear()
            }),
        }

        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            configurable: true,
        })
    })

    afterAll(() => {
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            configurable: true,
        })
        Object.defineProperty(globalThis, 'Audio', {
            value: originalAudio,
            configurable: true,
        })
    })

    it('defaults to disabled when storage is empty or invalid', () => {
        expect(isNotificationSoundEnabled()).toBe(false)

        window.localStorage.setItem('hapi-notification-sound-enabled', 'invalid')
        expect(isNotificationSoundEnabled()).toBe(false)
    })

    it('reads explicit boolean values from storage', () => {
        window.localStorage.setItem('hapi-notification-sound-enabled', 'true')
        expect(isNotificationSoundEnabled()).toBe(true)

        window.localStorage.setItem('hapi-notification-sound-enabled', 'false')
        expect(isNotificationSoundEnabled()).toBe(false)
    })

    it('plays the notification wav when audio is available', async () => {
        const play = vi.fn().mockResolvedValue(undefined)
        const pause = vi.fn()
        let createdWith: string | undefined

        class MockAudio {
            preload = 'auto'
            volume = 1
            currentTime = 0
            src = ''
            constructor(src?: string) {
                createdWith = src
                this.src = src ?? ''
            }
            play = play
            pause = pause
            load = vi.fn()
            addEventListener = vi.fn()
            removeEventListener = vi.fn()
        }

        Object.defineProperty(globalThis, 'Audio', {
            value: MockAudio,
            configurable: true,
        })

        await expect(playNotificationSound()).resolves.toBeUndefined()
        expect(createdWith).toBe('/notification-sound.wav')
        expect(play).toHaveBeenCalled()
    })

    it('no-ops when audio is unavailable', async () => {
        Object.defineProperty(globalThis, 'Audio', {
            value: undefined,
            configurable: true,
        })

        await expect(playNotificationSound()).resolves.toBeUndefined()
    })
})
