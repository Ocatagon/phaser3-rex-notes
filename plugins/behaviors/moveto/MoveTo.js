'use strict'

import GetSceneObject from 'rexPlugins/utils/system/GetSceneObject.js';

const EE = Phaser.Events.EventEmitter;
const GetValue = Phaser.Utils.Objects.GetValue;
const IsPlainObject = Phaser.Utils.Objects.IsPlainObject;
const DistanceBetween = Phaser.Math.Distance.Between;
const Lerp = Phaser.Math.Linear;
const AngleBetween = Phaser.Math.Angle.Between;


class MoveTo extends EE {
    constructor(gameObject, config) {
        super();

        this.gameObject = gameObject;
        this.scene = GetSceneObject(gameObject);

        this.tween = undefined;
        this.resetFromJSON(config);
        this.boot();
    }

    resetFromJSON(o) {
        this.isMoving = GetValue(o, 'isMoving', false);
        this.timeScale = GetValue(o, 'timeScale', 1);
        this.setSpeed(GetValue(o, 'speed', 400));
        this.setRotateToTarget(GetValue(o, 'rotateToTarget', false));
        this.targetX = GetValue(o, 'targetX', 0);
        this.targetY = GetValue(o, 'targetY', 0);
        this.tickMe = GetValue(o, 'tickMe', true); // true to enable 'update' callback
        return this;
    }

    toJSON() {
        return {
            isMoving: this.isMoving,
            timeScale: this.timeScale,
            speed: this.speed,
            rotateToTarget: this.rotateToTarget,
            targetX: this.targetX,
            targetY: this.targetY,
            tickMe: this.tickMe
        };
    }

    boot() {
        if (this.gameObject.on) { // oops, bob object does not have event emitter
            this.gameObject.on('destroy', this.destroy, this);
        }

        if (this.tickMe) {
            this.scene.events.on('update', this.update, this);
        }
    }

    shutdown() {
        super.shutdown();
        if (this.tickMe) {
            this.scene.events.off('update', this.update, this);
        }
        this.gameObject = undefined;
        this.scene = undefined;
    }

    destroy() {
        this.shutdown();
    }

    moveTo(x, y, speed) {
        this.stop();

        if (IsPlainObject(x)) {
            var config = x;
            x = GetValue(config, 'x', undefined);
            y = GetValue(config, 'y', undefined);
            speed = GetValue(config, 'speed', undefined);
        }
        this.targetX = x;
        this.targetY = y;
        if ((x == null) || (y == null)) {
            return this;
        }
        if (speed !== undefined) {
            this.speed = speed;
        }

        this.isMoving = true;
        return this;
    }

    stop() {
        this.isMoving = false;
    }

    setSpeed(speed) {
        this.speed = speed;
        return this;
    }

    setRotateToTarget(rotateToTarget) {
        this.rotateToTarget = rotateToTarget;
        return this;
    }

    update(time, delta) {
        if (!this.isMoving) {
            return;
        }

        var gameObject = this.gameObject;
        var curX = gameObject.x,
            curY = gameObject.y;
        var targetX = this.targetX,
            targetY = this.targetY;
        if ((curX === targetX) && (curY === targetY)) {
            this.onReachTarget();
            return;
        }

        if ((this.speed === 0) || (delta === 0)) {
            return;
        }

        var dt = (delta * this.timeScale) / 1000;
        var movingDist = this.speed * dt;
        var distToTarget = DistanceBetween(curX, curY, targetX, targetY);
        var newX, newY;
        if (movingDist < distToTarget) {
            var t = movingDist / distToTarget;
            newX = Lerp(curX, targetX, t);
            newY = Lerp(curY, targetY, t);
        } else {
            newX = targetX;
            newY = targetY;
        }

        gameObject.setPosition(newX, newY);
        if (this.rotateToTarget) {
            gameObject.rotation = AngleBetween(curX, curY, newX, newY);
        }
    }

    onReachTarget() {
        this.isMoving = false;
        this.emit('complete', this, this.gameObject);
    }
}

export default MoveTo;