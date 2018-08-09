import * as $protobuf from "protobufjs";
/** Properties of a Message. */
export interface IMessage {

    /** Message initiator */
    initiator?: (IInitiator|null);

    /** Message z */
    z?: (Uint8Array|null);

    /** Message x */
    x?: (Uint8Array|null);
}

/** Represents a Message. */
export class Message implements IMessage {

    /**
     * Creates a new Message instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Message instance
     */
    public static create(properties?: IMessage): Message;

    /**
     * Encodes the specified Message message. Does not implicitly {@link Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Message;

    /** Message initiator. */
    public initiator?: (IInitiator|null);

    /** Message z. */
    public z: Uint8Array;

    /** Message x. */
    public x: Uint8Array;

    /** Message type. */
    public type?: ("z"|"x");

    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: IMessage);
}

/** Properties of an Initiator. */
export interface IInitiator {

    /** Initiator id */
    id?: (number|null);

    /** Initiator counter */
    counter?: (number|null);

    /** Initiator members */
    members?: (number[]|null);
}

/** Represents an Initiator. */
export class Initiator implements IInitiator {

    /**
     * Creates a new Initiator instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Initiator instance
     */
    public static create(properties?: IInitiator): Initiator;

    /**
     * Encodes the specified Initiator message. Does not implicitly {@link Initiator.verify|verify} messages.
     * @param message Initiator message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IInitiator, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes an Initiator message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Initiator
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Initiator;

    /** Initiator id. */
    public id: number;

    /** Initiator counter. */
    public counter: number;

    /** Initiator members. */
    public members: number[];

    /**
     * Constructs a new Initiator.
     * @param [properties] Properties to set
     */
    constructor(properties?: IInitiator);
}

/** Properties of a CipherMessage. */
export interface ICipherMessage {

    /** CipherMessage id */
    id?: (number|null);

    /** CipherMessage counter */
    counter?: (number|null);

    /** CipherMessage content */
    content?: (Uint8Array|null);
}

/** Represents a CipherMessage. */
export class CipherMessage implements ICipherMessage {

    /**
     * Creates a new CipherMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CipherMessage instance
     */
    public static create(properties?: ICipherMessage): CipherMessage;

    /**
     * Encodes the specified CipherMessage message. Does not implicitly {@link CipherMessage.verify|verify} messages.
     * @param message CipherMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICipherMessage, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CipherMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CipherMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CipherMessage;

    /** CipherMessage id. */
    public id: number;

    /** CipherMessage counter. */
    public counter: number;

    /** CipherMessage content. */
    public content: Uint8Array;

    /**
     * Constructs a new CipherMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICipherMessage);
}
