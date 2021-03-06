import { Text } from './Text';
import { IResponse } from './Response';
import { IRequest, IWitEntity } from './Request';
import { Request, Response } from 'express'
import { inspect } from 'util'

export interface IMiddlewareHandler {
    run: (request: IRequest, intent: IWitEntity[], entities: { [name: string]: IWitEntity[] }) => IResponse | Promise<IResponse>,
    intent?: string,
    entities?: (string | [string, string] | [string])[]
}

export class Middleware {
    static create(handlers: IMiddlewareHandler[]) {
        return async (req: Request, res: Response) => {
            console.log('New request received:', inspect(req.body, false, 12))

            const loop = async (i: number = 0) => {
                if (i === handlers.length) {
                    throw new Error('No handler')
                } else {
                    try {
                        const handler = handlers[i]
                        const body: IRequest = req.body
                        const { entities } = body.conversation.messages[0].messageValidation.data

                        //validate intent
                        if (handler.intent) {
                            const index = entities.intent.findIndex(e => {
                                return e.value === handler.intent
                            })

                            if (index === -1) {
                                throw new Error('Intent not found')
                            }
                        }

                        //validate entities
                        if (handler.entities) {
                            const allAreValid = handler.entities.every(entity => {
                                const entityName = typeof entity === 'string' ? entity : entity[0]

                                const entityValues = entities[entityName]

                                if (typeof entity === 'string' || entity.length === 1) {
                                    return !!entityValues
                                } else {
                                    if (!entityValues) {
                                        return false
                                    }
                                    const wantedValue = entity[1]
                                    return entityValues.findIndex(v => v.value === wantedValue) > -1
                                }
                            })

                            if (!allAreValid) {
                                throw new Error('Entities not found')
                            }
                        }


                        const res = await handlers[i].run(req.body, entities.intent, entities)

                        if (res instanceof Object) {
                            return res
                        } else {
                            throw new Error('No object')
                        }
                    } catch (e) {
                        console.error(`Middleware #${i + 1} failed because of:`, e)
                        return await loop(i + 1)
                    }
                }
            }

            try {
                const response = await loop()

                if (!response.speakText) {
                    response.speakText = Text.withoutEmojis(response.text)
                }

                res.json(response)
            } catch (e) {
                res.sendStatus(500)
            }
        }
    }
}