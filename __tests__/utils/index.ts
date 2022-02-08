export class Counter {
    protected counter = 0

    public get callCount(): number {
        return this.counter
    }

    public get count(): number {
        return this.counter
    }

    public increment = () => {
        this.counter++
    }

    public call = () => {
        this.increment()
    }
}

type Item = {
    id: number
    counter: number
    until: number
    resolve: () => void
    reject: (reason: unknown) => void
}

export class Awaiter extends Counter {
    private _idCounter = 0
    private _awaiterItems: Item[] = []

    public override increment = () => {
        this.counter++
        this._resolveItems()
    }

    public override call = () => {
        this.increment()
    }

    /** @param timeout - Timeout in ms */
    public async wait(timeout?: number): Promise<void> {
        return this.waitFor(1, timeout)
    }

    /**
     * Waits for `numberOfCalls` to happen from the time of instantiation of this class
     *
     * @param numberOfTotalCalls - Number of calls to wait for since instantiation
     * @param timeout - Timeout in ms
     */
    public async waitUntil(numberOfTotalCalls: number, timeout?: number): Promise<void> {
        return this.waitFor(numberOfTotalCalls - this.counter, timeout)
    }

    /**
     * Waits for `numberOfCalls` to happen from the time of initialization of this function
     *
     * @param numberOfCalls - Number of calls to wait for starting now
     * @param timeout - Timeout in ms
     */
    public async waitFor(numberOfCalls: number, timeout?: number): Promise<void> {
        const id = this._idCounter++
        let timeoutId: NodeJS.Timeout | undefined

        if (timeout !== undefined) {
            timeoutId = setTimeout(() => {
                this._awaiterItems
                    .find((item) => item.id === id)
                    ?.reject(new Error("Awaiter timed out"))
            }, timeout)
        }

        return new Promise((resolve, reject) => {
            this._awaiterItems.push({
                id,
                counter: 0,
                until: numberOfCalls,
                resolve() {
                    if (timeoutId) {
                        clearTimeout(timeoutId)
                    }

                    resolve()
                },
                reject(reason?: unknown) {
                    if (timeoutId) {
                        clearTimeout(timeoutId)
                    }

                    reject(reason)
                },
            })
        })
    }

    private _resolveItems(): void {
        const indexesToPurge: number[] = []

        for (const [index, item] of this._awaiterItems.entries()) {
            item.counter++

            if (item.counter >= item.until) {
                item.resolve()
                indexesToPurge.push(index)
            }
        }

        indexesToPurge.sort((first, second) => -first + second)

        for (const index of indexesToPurge) {
            this._awaiterItems.splice(index, 1)
        }
    }
}
