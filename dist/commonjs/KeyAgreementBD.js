"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var KeyStatusEnum_1 = require("./KeyStatusEnum");
var GroupStatus;
(function (GroupStatus) {
    GroupStatus[GroupStatus["JOINING"] = 0] = "JOINING";
    GroupStatus[GroupStatus["JOINED"] = 1] = "JOINED";
    GroupStatus[GroupStatus["LEFT"] = 2] = "LEFT";
})(GroupStatus = exports.GroupStatus || (exports.GroupStatus = {}));
var Step;
(function (Step) {
    Step[Step["WAITING_Z"] = 0] = "WAITING_Z";
    Step[Step["WAITING_X"] = 1] = "WAITING_X";
    Step[Step["READY"] = 2] = "READY";
})(Step = exports.Step || (exports.Step = {}));
var KeyAgreementBD = (function () {
    function KeyAgreementBD(memberJoinSource, memberLeaveSource, groupStatusSource, messageSource) {
        this.step = Step.WAITING_Z;
        this.isInitiator = false;
        this.key = undefined;
        this.status = KeyStatusEnum_1.KeyStatusEnum.UNDEFINED;
        this.subs = [];
        this.members = [];
        this.initiatorMembers = [];
        this.myId = 0;
        this.r = undefined;
        this.zArray = [];
        this.xArray = [];
        this.groupStatus = GroupStatus.LEFT;
        this.setMemberJoinSource(memberJoinSource);
        this.setMemberLeaveSource(memberLeaveSource);
        this.setGroupStatusSource(groupStatusSource);
    }
    KeyAgreementBD.prototype.dispose = function () {
        this.subs.forEach(function (sub) { return sub.unsubscribe(); });
    };
    KeyAgreementBD.prototype.verifyInitiator = function () {
        this.isInitiator = this.myId <= Math.min.apply(Math, __spread(this.members));
    };
    KeyAgreementBD.prototype.init = function (myId) {
        if (this.myId === 0) {
            this.myId = myId;
        }
    };
    KeyAgreementBD.prototype.clean = function () {
        this.isInitiator = false;
        this.key = undefined;
        this.status = KeyStatusEnum_1.KeyStatusEnum.UNDEFINED;
        this.subs = [];
        this.members = [];
        this.initiatorMembers = [];
        this.myId = 0;
        this.r = undefined;
        this.zArray = [];
        this.xArray = [];
    };
    KeyAgreementBD.prototype.addMember = function (id) {
        this.members.push(id);
        this.members.sort();
    };
    KeyAgreementBD.prototype.deleteMember = function (id) {
        var memberIndex = this.members.indexOf(id);
        if (memberIndex >= 0) {
            this.members.splice(memberIndex, 1);
        }
    };
    KeyAgreementBD.prototype.setMemberJoinSource = function (memberJoinSource) {
        var _this = this;
        this.subs.push(memberJoinSource.subscribe(function (_a) {
            var myId = _a.myId, id = _a.id;
            _this.init(myId);
            _this.addMember(id);
            if (_this.groupStatus === GroupStatus.JOINED) {
                _this.verifyInitiator();
                if (_this.isInitiator) {
                    _this.startCycle();
                }
                else if (_this.step === Step.WAITING_Z) {
                }
                else if (_this.step === Step.WAITING_X) {
                }
            }
        }));
    };
    KeyAgreementBD.prototype.setMemberLeaveSource = function (memberLeaveSource) {
        var _this = this;
        memberLeaveSource.subscribe(function (_a) {
            var myId = _a.myId, id = _a.id;
            _this.init(myId);
            _this.deleteMember(id);
            _this.verifyInitiator();
            if (_this.isInitiator && _this.step !== Step.READY) {
                _this.startCycle();
            }
            else if (_this.step === Step.WAITING_Z) {
            }
            else if (_this.step === Step.WAITING_X) {
            }
        });
    };
    KeyAgreementBD.prototype.setGroupStatusSource = function (groupStatusSource) {
        var _this = this;
        this.subs.push(groupStatusSource.subscribe(function (_a) {
            var myId = _a.myId, status = _a.status;
            if (status === GroupStatus.JOINED) {
                _this.init(myId);
                _this.verifyInitiator();
                if (_this.isInitiator) {
                    _this.startCycle();
                }
            }
            else if (status === GroupStatus.LEFT) {
                _this.clean();
            }
        }));
    };
    KeyAgreementBD.prototype.startCycle = function () { };
    return KeyAgreementBD;
}());
exports.KeyAgreementBD = KeyAgreementBD;
//# sourceMappingURL=KeyAgreementBD.js.map