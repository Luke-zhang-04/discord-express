export class MockNext {
    private _callCount = 0
    private _resolve: undefined | ((value: void | PromiseLike<void>) => void) = undefined
    private _promise: Promise<void> = new Promise((resolve) => {
        this._resolve = resolve
    })

    public constructor() {
        this._callCount = 0
    }

    public get callCount(): number {
        return this._callCount
    }

    public next(): void {
        this._callCount++
        this._resolve?.()
    }

    public waitForNext() {
        return this._promise
    }

    public setNextAwaiter() {
        this._promise = new Promise((resolve) => {
            this._resolve = resolve
        })
    }
}
