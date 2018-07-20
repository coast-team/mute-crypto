/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const Message = $root.Message = (() => {

    /**
     * Properties of a Message.
     * @exports IMessage
     * @interface IMessage
     * @property {IInitiator|null} [restart] Message restart
     * @property {Uint8Array|null} [z] Message z
     * @property {Uint8Array|null} [x] Message x
     */

    /**
     * Constructs a new Message.
     * @exports Message
     * @classdesc Represents a Message.
     * @implements IMessage
     * @constructor
     * @param {IMessage=} [properties] Properties to set
     */
    function Message(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Message restart.
     * @member {IInitiator|null|undefined} restart
     * @memberof Message
     * @instance
     */
    Message.prototype.restart = null;

    /**
     * Message z.
     * @member {Uint8Array} z
     * @memberof Message
     * @instance
     */
    Message.prototype.z = $util.newBuffer([]);

    /**
     * Message x.
     * @member {Uint8Array} x
     * @memberof Message
     * @instance
     */
    Message.prototype.x = $util.newBuffer([]);

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * Message type.
     * @member {"restart"|"z"|"x"|undefined} type
     * @memberof Message
     * @instance
     */
    Object.defineProperty(Message.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["restart", "z", "x"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    /**
     * Creates a new Message instance using the specified properties.
     * @function create
     * @memberof Message
     * @static
     * @param {IMessage=} [properties] Properties to set
     * @returns {Message} Message instance
     */
    Message.create = function create(properties) {
        return new Message(properties);
    };

    /**
     * Encodes the specified Message message. Does not implicitly {@link Message.verify|verify} messages.
     * @function encode
     * @memberof Message
     * @static
     * @param {IMessage} message Message message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Message.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.restart != null && message.hasOwnProperty("restart"))
            $root.Initiator.encode(message.restart, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.z != null && message.hasOwnProperty("z"))
            writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.z);
        if (message.x != null && message.hasOwnProperty("x"))
            writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.x);
        return writer;
    };

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @function decode
     * @memberof Message
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Message} Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Message.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.Message();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.restart = $root.Initiator.decode(reader, reader.uint32());
                break;
            case 2:
                message.z = reader.bytes();
                break;
            case 3:
                message.x = reader.bytes();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    return Message;
})();

export const Initiator = $root.Initiator = (() => {

    /**
     * Properties of an Initiator.
     * @exports IInitiator
     * @interface IInitiator
     * @property {Uint8Array|null} [z] Initiator z
     * @property {Array.<number>|null} [members] Initiator members
     */

    /**
     * Constructs a new Initiator.
     * @exports Initiator
     * @classdesc Represents an Initiator.
     * @implements IInitiator
     * @constructor
     * @param {IInitiator=} [properties] Properties to set
     */
    function Initiator(properties) {
        this.members = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Initiator z.
     * @member {Uint8Array} z
     * @memberof Initiator
     * @instance
     */
    Initiator.prototype.z = $util.newBuffer([]);

    /**
     * Initiator members.
     * @member {Array.<number>} members
     * @memberof Initiator
     * @instance
     */
    Initiator.prototype.members = $util.emptyArray;

    /**
     * Creates a new Initiator instance using the specified properties.
     * @function create
     * @memberof Initiator
     * @static
     * @param {IInitiator=} [properties] Properties to set
     * @returns {Initiator} Initiator instance
     */
    Initiator.create = function create(properties) {
        return new Initiator(properties);
    };

    /**
     * Encodes the specified Initiator message. Does not implicitly {@link Initiator.verify|verify} messages.
     * @function encode
     * @memberof Initiator
     * @static
     * @param {IInitiator} message Initiator message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Initiator.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.z != null && message.hasOwnProperty("z"))
            writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.z);
        if (message.members != null && message.members.length) {
            writer.uint32(/* id 2, wireType 2 =*/18).fork();
            for (let i = 0; i < message.members.length; ++i)
                writer.uint32(message.members[i]);
            writer.ldelim();
        }
        return writer;
    };

    /**
     * Decodes an Initiator message from the specified reader or buffer.
     * @function decode
     * @memberof Initiator
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Initiator} Initiator
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Initiator.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.Initiator();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.z = reader.bytes();
                break;
            case 2:
                if (!(message.members && message.members.length))
                    message.members = [];
                if ((tag & 7) === 2) {
                    let end2 = reader.uint32() + reader.pos;
                    while (reader.pos < end2)
                        message.members.push(reader.uint32());
                } else
                    message.members.push(reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    return Initiator;
})();

export { $root as default };
