/** Code adapted from jschardet by António Afonso, browserify-ed.
    I'm only concerned with ISO-8859 and UTF-8, 
    therefore many probers have been removed to improve performance
    and to avoid incorrect detections (such as IBM855 and MacCyrillic).
**/

// TODO: remove dead code and minify

var jschardet = {};


(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./src-latin-utf');

},{"./src-latin-utf":6}],2:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

!function(jschardet) {
    
jschardet.CharSetGroupProber = function() {
    jschardet.CharSetProber.apply(this);
    
    var self = this;
    
    function init() {
        self._mActiveNum = 0;
        self._mProbers = [];
        self._mBestGuessProber = null;
    }
    
    this.reset = function() {
        jschardet.CharSetGroupProber.prototype.reset.apply(this);
        this._mActiveNum = 0;
        for( var i = 0, prober; prober = this._mProbers[i]; i++ ) {
            if( prober ) {
                prober.reset();
                prober.active = true;
                this._mActiveNum++;
            }
        }
        this._mBestGuessProber = null;
    }
    
    this.getCharsetName = function() {
        if( !this._mBestGuessProber ) {
            this.getConfidence();
            if( !this._mBestGuessProber ) return null;
        }
        return this._mBestGuessProber.getCharsetName();
    }
    
    this.feed = function(aBuf) {
        for( var i = 0, prober; prober = this._mProbers[i]; i++ ) {
            if( !prober || !prober.active ) continue;
            var st = prober.feed(aBuf);
            if( !st ) continue;
            if( st == jschardet.Constants.foundIt ) {
                this._mBestGuessProber = prober;
                return this.getState();
            } else if( st == jschardet.Constants.notMe ) {
                prober.active = false;
                this._mActiveNum--;
                if( this._mActiveNum <= 0 ) {
                    this._mState = jschardet.Constants.notMe;
                    return this.getState();
                }
            }
        }
        return this.getState();
    }
    
    this.getConfidence = function() {
        var st = this.getState();
        if( st == jschardet.Constants.foundIt ) {
            return 0.99;
        } else if( st == jschardet.Constants.notMe ) {
            return 0.01;
        }
        var bestConf = 0.0;
        this._mBestGuessProber = null;
        for( var i = 0, prober; prober = this._mProbers[i]; i++ ) {
            if( !prober ) continue;
            if( !prober.active ) {
                if( jschardet.Constants._debug ) {
                    log(prober.getCharsetName() + " not active\n");
                }
                continue;
            }
            var cf = prober.getConfidence();
            if( jschardet.Constants._debug ) {
                log(prober.getCharsetName() + " confidence = " + cf + "\n");
            }
            if( bestConf < cf ) {
                bestConf = cf;
                this._mBestGuessProber = prober;
            }
        }
        if( !this._mBestGuessProber ) return 0.0;
        return bestConf;
    }
    
    init();
}
jschardet.CharSetGroupProber.prototype = new jschardet.CharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":18}],3:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

!function(jschardet) {  
    
jschardet.CharSetProber = function() {
    this.reset = function() {
        this._mState = jschardet.Constants.detecting;
    }
    
    this.getCharsetName = function() {
        return null;
    }
    
    this.feed = function(aBuf) {
    }
    
    this.getState = function() {
        return this._mState;
    }
    
    this.getConfidence = function() {
        return 0.0;
    }
    
    this.filterHighBitOnly = function(aBuf) {
        aBuf = aBuf.replace(/[\x00-\x7F]+/g, " ");
        return aBuf;
    }
    
    this.filterWithoutEnglishLetters = function(aBuf) {
        aBuf = aBuf.replace(/[A-Za-z]+/g, " ");
        return aBuf;
    }
    
    this.filterWithEnglishLetters = function(aBuf) {
        // TODO
        return aBuf;
    }
}

}(jschardet);
}).call(this,require('_process'))
},{"_process":18}],4:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

!function(jschardet) {
    
jschardet.CodingStateMachine = function(sm) {
    var self = this;
    
    function init(sm) {
        self._mModel = sm;
        self._mCurrentBytePos = 0;
        self._mCurrentCharLen = 0;
        self.reset();
    }
    
    this.reset = function() {
        this._mCurrentState = jschardet.Constants.start;
    }
    
    this.nextState = function(c) {
        // for each byte we get its class
        // if it is first byte, we also get byte length
        var byteCls = this._mModel.classTable[c.charCodeAt(0)];
        if( this._mCurrentState == jschardet.Constants.start ) {
            this._mCurrentBytePos = 0;
            this._mCurrentCharLen = this._mModel.charLenTable[byteCls];
        }
        // from byte's class and stateTable, we get its next state
        this._mCurrentState = this._mModel.stateTable[this._mCurrentState * this._mModel.classFactor + byteCls];
        this._mCurrentBytePos++;
        return this._mCurrentState;
    }
    
    this.getCurrentCharLen = function() {
        return this._mCurrentCharLen;
    }
    
    this.getCodingStateMachine = function() {
        return this._mModel.name;
    }
    
    init(sm);
}

}(jschardet);
}).call(this,require('_process'))
},{"_process":18}],5:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

!function(jschardet) {
    
jschardet.Constants = {
    _debug      : false,
    
    detecting   : 0,
    foundIt     : 1,
    notMe       : 2,
                
    start       : 0,
    error       : 1,
    itsMe       : 2,
    
    SHORTCUT_THRESHOLD  : 0.95
};

}(jschardet);
}).call(this,require('_process'))
},{"_process":18}],6:[function(require,module,exports){
module.exports = require('./init')
},{"./init":7}],7:[function(require,module,exports){
(function (process,Buffer){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

if (typeof process !== 'undefined' && typeof process.title !== 'undefined')
{
    jschardet = exports;
    require('./constants');
    require('./codingstatemachine');
    require('./mbcssm');
    require('./charsetprober');
    require('./mbcharsetprober');
    require('./utf8prober');
    require('./charsetgroupprober');
    require('./mbcsgroupprober');
    require('./sbcharsetprober');
    require('./latin1prober');
    require('./universaldetector');
}

jschardet.VERSION = "0.1";
jschardet.detect = function(buffer) {
    var u = new jschardet.UniversalDetector();
    u.reset();
    if( typeof Buffer == 'function' && buffer instanceof Buffer ) {
        var str = "";
        for (var i = 0; i < buffer.length; ++i)
            str += String.fromCharCode(buffer[i])
        u.feed(str);
    } else {
        u.feed(buffer);
    }
    u.close();
    return u.result;
}

}).call(this,require('_process'),require("buffer").Buffer)
},{"./charsetgroupprober":2,"./charsetprober":3,"./codingstatemachine":4,"./constants":5,"./latin1prober":8,"./mbcharsetprober":9,"./mbcsgroupprober":10,"./mbcssm":11,"./sbcharsetprober":12,"./universaldetector":13,"./utf8prober":14,"_process":18,"buffer":15}],8:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

!function(jschardet) {
    
(function() {
    var UDF = 0; // undefined
    var OTH = 1; // other
    jschardet.OTH = 1;
    var ASC = 2; // ascii capital letter
    var ASS = 3; // ascii small letter
    var ACV = 4; // accent capital vowel
    var ACO = 5; // accent capital other
    var ASV = 6; // accent small vowel
    var ASO = 7; // accent small other

    jschardet.Latin1_CharToClass = [
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // 00 - 07
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // 08 - 0F
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // 10 - 17
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // 18 - 1F
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // 20 - 27
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // 28 - 2F
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // 30 - 37
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // 38 - 3F
      OTH, ASC, ASC, ASC, ASC, ASC, ASC, ASC,   // 40 - 47
      ASC, ASC, ASC, ASC, ASC, ASC, ASC, ASC,   // 48 - 4F
      ASC, ASC, ASC, ASC, ASC, ASC, ASC, ASC,   // 50 - 57
      ASC, ASC, ASC, OTH, OTH, OTH, OTH, OTH,   // 58 - 5F
      OTH, ASS, ASS, ASS, ASS, ASS, ASS, ASS,   // 60 - 67
      ASS, ASS, ASS, ASS, ASS, ASS, ASS, ASS,   // 68 - 6F
      ASS, ASS, ASS, ASS, ASS, ASS, ASS, ASS,   // 70 - 77
      ASS, ASS, ASS, OTH, OTH, OTH, OTH, OTH,   // 78 - 7F
      OTH, UDF, OTH, ASO, OTH, OTH, OTH, OTH,   // 80 - 87
      OTH, OTH, ACO, OTH, ACO, UDF, ACO, UDF,   // 88 - 8F
      UDF, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // 90 - 97
      OTH, OTH, ASO, OTH, ASO, UDF, ASO, ACO,   // 98 - 9F
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // A0 - A7
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // A8 - AF
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // B0 - B7
      OTH, OTH, OTH, OTH, OTH, OTH, OTH, OTH,   // B8 - BF
      ACV, ACV, ACV, ACV, ACV, ACV, ACO, ACO,   // C0 - C7
      ACV, ACV, ACV, ACV, ACV, ACV, ACV, ACV,   // C8 - CF
      ACO, ACO, ACV, ACV, ACV, ACV, ACV, OTH,   // D0 - D7
      ACV, ACV, ACV, ACV, ACV, ACO, ACO, ACO,   // D8 - DF
      ASV, ASV, ASV, ASV, ASV, ASV, ASO, ASO,   // E0 - E7
      ASV, ASV, ASV, ASV, ASV, ASV, ASV, ASV,   // E8 - EF
      ASO, ASO, ASV, ASV, ASV, ASV, ASV, OTH,   // F0 - F7
      ASV, ASV, ASV, ASV, ASV, ASO, ASO, ASO    // F8 - FF
    ];

    // 0 : illegal 
    // 1 : very unlikely 
    // 2 : normal 
    // 3 : very likely
    jschardet.Latin1ClassModel = [
    // UDF OTH ASC ASS ACV ACO ASV ASO
       0,  0,  0,  0,  0,  0,  0,  0,  // UDF
       0,  3,  3,  3,  3,  3,  3,  3,  // OTH
       0,  3,  3,  3,  3,  3,  3,  3,  // ASC
       0,  3,  3,  3,  1,  1,  3,  3,  // ASS
       0,  3,  3,  3,  1,  2,  1,  2,  // ACV
       0,  3,  3,  3,  3,  3,  3,  3,  // ACO
       0,  3,  1,  3,  1,  1,  1,  3,  // ASV
       0,  3,  1,  3,  1,  1,  3,  3   // ASO
    ];    
})();

jschardet.Latin1Prober = function() {
    jschardet.CharSetProber.apply(this);
    
    var FREQ_CAT_NUM = 4;
    var CLASS_NUM = 8; // total classes
    var self = this;
    
    function init() {
        self.reset();
    }
    
    this.reset = function() {
        this._mLastCharClass = jschardet.OTH;
        this._mFreqCounter = [];
        for( var i = 0; i < FREQ_CAT_NUM; this._mFreqCounter[i++] = 0 );
        jschardet.Latin1Prober.prototype.reset.apply(this);
    }
    
    this.getCharsetName = function() {
        return "windows-1252";
    }
    
    this.feed = function(aBuf) {
        aBuf = this.filterWithEnglishLetters(aBuf);
        for( var i = 0; i < aBuf.length; i++ ) {
            var c = aBuf.charCodeAt(i);
            var charClass = jschardet.Latin1_CharToClass[c];
            var freq = jschardet.Latin1ClassModel[(this._mLastCharClass * CLASS_NUM) + charClass];
            if( freq == 0 ) {
                this._mState = jschardet.Constants.notMe;
                break;
            }
            this._mFreqCounter[freq]++;
            this._mLastCharClass = charClass;
        }
        
        return this.getState();
    }

    this.getConfidence = function() {
        if( this.getState() == jschardet.Constants.notMe ) {
            return 0.01;
        }
        
        var total = 0;
        for( var i = 0; i < this._mFreqCounter.length; i++ ) {
            total += this._mFreqCounter[i];
        }
        if( total < 0.01 ) {
            constants = 0.0;
        } else {
            confidence = (this._mFreqCounter[3] / total) - (this._mFreqCounter[1] * 20 / total);
        }
        if( confidence < 0 ) {
            confidence = 0.0;
        }
        // lower the confidence of latin1 so that other more accurate detector 
        // can take priority.
        //
        // antonio.afonso: need to change this otherwise languages like pt, es, fr using latin1 will never be detected.
        confidence = confidence * 0.95;
        return confidence;
    }

    init();
}
jschardet.Latin1Prober.prototype = new jschardet.CharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":18}],9:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

!function(jschardet) {
    
jschardet.MultiByteCharSetProber = function() {
    jschardet.CharSetProber.apply(this);
    
    var self = this;
    
    function init() {
        self._mDistributionAnalyzer = null;
        self._mCodingSM = null;
        //self._mLastChar = ["\x00", "\x00"];
        self._mLastChar = "\x00\x00";
    }
    
    this.reset = function() {
        jschardet.MultiByteCharSetProber.prototype.reset.apply(this);
        if( this._mCodingSM ) {
            this._mCodingSM.reset();
        }
        if( this._mDistributionAnalyzer ) {
            this._mDistributionAnalyzer.reset();
        }
        //this._mLastChar = ["\x00", "\x00"];
        this._mLastChar = "\x00\x00";
    }
    
    this.getCharsetName = function() {
    }
    
    this.feed = function(aBuf) {
        var aLen = aBuf.length;
        for( var i = 0; i < aLen; i++ ) {
            var codingState = this._mCodingSM.nextState(aBuf[i]);
            if( codingState == jschardet.Constants.error ) {
                if( jschardet.Constants._debug ) {
                    log(this.getCharsetName() + " prober hit error at byte " + i + "\n");
                }
                this._mState = jschardet.Constants.notMe;
                break;
            } else if( codingState == jschardet.Constants.itsMe ) {
                this._mState = jschardet.Constants.foundIt;
                break;
            } else if( codingState == jschardet.Constants.start ) {
                var charLen = this._mCodingSM.getCurrentCharLen();
                if( i == 0 ) {
                    this._mLastChar[1] = aBuf[0];
                    this._mDistributionAnalyzer.feed(this._mLastChar, charLen);
                } else {
                    this._mDistributionAnalyzer.feed(aBuf.slice(i-1,i+1), charLen);
                }
            }
        }
        
        this._mLastChar[0] = aBuf[aLen - 1];
        
        if( this.getState() == jschardet.Constants.detecting ) {
            if( this._mDistributionAnalyzer.gotEnoughData() &&
                this.getConfidence() > jschardet.Constants.SHORTCUT_THRESHOLD ) {
                this._mState = jschardet.Constants.foundIt;
            }
        }
        
        return this.getState();
    }
    
    this.getConfidence = function() {
        return this._mDistributionAnalyzer.getConfidence();
    }
}
jschardet.MultiByteCharSetProber.prototype = new jschardet.CharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":18}],10:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

!function(jschardet) {
    
jschardet.MBCSGroupProber = function() {
    jschardet.CharSetGroupProber.apply(this);
    this._mProbers = [
        new jschardet.UTF8Prober(),
    ];
    this.reset();
}
jschardet.MBCSGroupProber.prototype = new jschardet.CharSetGroupProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":18}],11:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

!function(jschardet) {
    
//UCS2-BE

UCS2BE_cls = [
    0,0,0,0,0,0,0,0,  // 00 - 07 
    0,0,1,0,0,2,0,0,  // 08 - 0f 
    0,0,0,0,0,0,0,0,  // 10 - 17 
    0,0,0,3,0,0,0,0,  // 18 - 1f 
    0,0,0,0,0,0,0,0,  // 20 - 27 
    0,3,3,3,3,3,0,0,  // 28 - 2f 
    0,0,0,0,0,0,0,0,  // 30 - 37 
    0,0,0,0,0,0,0,0,  // 38 - 3f 
    0,0,0,0,0,0,0,0,  // 40 - 47 
    0,0,0,0,0,0,0,0,  // 48 - 4f 
    0,0,0,0,0,0,0,0,  // 50 - 57 
    0,0,0,0,0,0,0,0,  // 58 - 5f 
    0,0,0,0,0,0,0,0,  // 60 - 67 
    0,0,0,0,0,0,0,0,  // 68 - 6f 
    0,0,0,0,0,0,0,0,  // 70 - 77 
    0,0,0,0,0,0,0,0,  // 78 - 7f 
    0,0,0,0,0,0,0,0,  // 80 - 87 
    0,0,0,0,0,0,0,0,  // 88 - 8f 
    0,0,0,0,0,0,0,0,  // 90 - 97 
    0,0,0,0,0,0,0,0,  // 98 - 9f 
    0,0,0,0,0,0,0,0,  // a0 - a7 
    0,0,0,0,0,0,0,0,  // a8 - af 
    0,0,0,0,0,0,0,0,  // b0 - b7 
    0,0,0,0,0,0,0,0,  // b8 - bf 
    0,0,0,0,0,0,0,0,  // c0 - c7 
    0,0,0,0,0,0,0,0,  // c8 - cf 
    0,0,0,0,0,0,0,0,  // d0 - d7 
    0,0,0,0,0,0,0,0,  // d8 - df 
    0,0,0,0,0,0,0,0,  // e0 - e7 
    0,0,0,0,0,0,0,0,  // e8 - ef 
    0,0,0,0,0,0,0,0,  // f0 - f7 
    0,0,0,0,0,0,4,5   // f8 - ff 
];

with( jschardet.Constants )
jschardet.UCS2BE_st  = [
         5,    7,    7,error,    4,    3,error,error, //00-07 
     error,error,error,error,itsMe,itsMe,itsMe,itsMe, //08-0f 
     itsMe,itsMe,    6,    6,    6,    6,error,error, //10-17 
         6,    6,    6,    6,    6,itsMe,    6,    6, //18-1f 
         6,    6,    6,    6,    5,    7,    7,error, //20-27 
         5,    8,    6,    6,error,    6,    6,    6, //28-2f 
         6,    6,    6,    6,error,error,start,start  //30-37 
];

jschardet.UCS2BECharLenTable = [2, 2, 2, 0, 2, 2];

jschardet.UCS2BESMModel = {
    "classTable"    : jschardet.UCS2BE_cls,
    "classFactor"   : 6,
    "stateTable"    : jschardet.UCS2BE_st,
    "charLenTable"  : jschardet.UCS2BECharLenTable,
    "name"          : "UTF-16BE"
};

// UCS2-LE

jschardet.UCS2LE_cls = [
    0,0,0,0,0,0,0,0,  // 00 - 07 
    0,0,1,0,0,2,0,0,  // 08 - 0f 
    0,0,0,0,0,0,0,0,  // 10 - 17 
    0,0,0,3,0,0,0,0,  // 18 - 1f 
    0,0,0,0,0,0,0,0,  // 20 - 27 
    0,3,3,3,3,3,0,0,  // 28 - 2f 
    0,0,0,0,0,0,0,0,  // 30 - 37 
    0,0,0,0,0,0,0,0,  // 38 - 3f 
    0,0,0,0,0,0,0,0,  // 40 - 47 
    0,0,0,0,0,0,0,0,  // 48 - 4f 
    0,0,0,0,0,0,0,0,  // 50 - 57 
    0,0,0,0,0,0,0,0,  // 58 - 5f 
    0,0,0,0,0,0,0,0,  // 60 - 67 
    0,0,0,0,0,0,0,0,  // 68 - 6f 
    0,0,0,0,0,0,0,0,  // 70 - 77 
    0,0,0,0,0,0,0,0,  // 78 - 7f 
    0,0,0,0,0,0,0,0,  // 80 - 87 
    0,0,0,0,0,0,0,0,  // 88 - 8f 
    0,0,0,0,0,0,0,0,  // 90 - 97 
    0,0,0,0,0,0,0,0,  // 98 - 9f 
    0,0,0,0,0,0,0,0,  // a0 - a7 
    0,0,0,0,0,0,0,0,  // a8 - af 
    0,0,0,0,0,0,0,0,  // b0 - b7 
    0,0,0,0,0,0,0,0,  // b8 - bf 
    0,0,0,0,0,0,0,0,  // c0 - c7 
    0,0,0,0,0,0,0,0,  // c8 - cf 
    0,0,0,0,0,0,0,0,  // d0 - d7 
    0,0,0,0,0,0,0,0,  // d8 - df 
    0,0,0,0,0,0,0,0,  // e0 - e7 
    0,0,0,0,0,0,0,0,  // e8 - ef 
    0,0,0,0,0,0,0,0,  // f0 - f7 
    0,0,0,0,0,0,4,5   // f8 - ff 
];

with( jschardet.Constants )
jschardet.UCS2LE_st = [
         6,    6,    7,    6,    4,    3,error,error, //00-07 
     error,error,error,error,itsMe,itsMe,itsMe,itsMe, //08-0f 
     itsMe,itsMe,    5,    5,    5,error,itsMe,error, //10-17 
         5,    5,    5,error,    5,error,    6,    6, //18-1f 
         7,    6,    8,    8,    5,    5,    5,error, //20-27 
         5,    5,    5,error,error,error,    5,    5, //28-2f 
         5,    5,    5,error,    5,error,start,start  //30-37 
];

jschardet.UCS2LECharLenTable = [2, 2, 2, 2, 2, 2];

jschardet.UCS2LESMModel = {
    "classTable"    : jschardet.UCS2LE_cls,
    "classFactor"   : 6,
    "stateTable"    : jschardet.UCS2LE_st,
    "charLenTable"  : jschardet.UCS2LECharLenTable,
    "name"          : "UTF-16LE"
};

// UTF-8

jschardet.UTF8_cls = [
    1,1,1,1,1,1,1,1,  // 00 - 07  //allow 0x00 as a legal value
    1,1,1,1,1,1,0,0,  // 08 - 0f 
    1,1,1,1,1,1,1,1,  // 10 - 17 
    1,1,1,0,1,1,1,1,  // 18 - 1f 
    1,1,1,1,1,1,1,1,  // 20 - 27 
    1,1,1,1,1,1,1,1,  // 28 - 2f 
    1,1,1,1,1,1,1,1,  // 30 - 37 
    1,1,1,1,1,1,1,1,  // 38 - 3f 
    1,1,1,1,1,1,1,1,  // 40 - 47 
    1,1,1,1,1,1,1,1,  // 48 - 4f 
    1,1,1,1,1,1,1,1,  // 50 - 57 
    1,1,1,1,1,1,1,1,  // 58 - 5f 
    1,1,1,1,1,1,1,1,  // 60 - 67 
    1,1,1,1,1,1,1,1,  // 68 - 6f 
    1,1,1,1,1,1,1,1,  // 70 - 77 
    1,1,1,1,1,1,1,1,  // 78 - 7f 
    2,2,2,2,3,3,3,3,  // 80 - 87 
    4,4,4,4,4,4,4,4,  // 88 - 8f 
    4,4,4,4,4,4,4,4,  // 90 - 97 
    4,4,4,4,4,4,4,4,  // 98 - 9f 
    5,5,5,5,5,5,5,5,  // a0 - a7 
    5,5,5,5,5,5,5,5,  // a8 - af 
    5,5,5,5,5,5,5,5,  // b0 - b7 
    5,5,5,5,5,5,5,5,  // b8 - bf 
    0,0,6,6,6,6,6,6,  // c0 - c7 
    6,6,6,6,6,6,6,6,  // c8 - cf 
    6,6,6,6,6,6,6,6,  // d0 - d7 
    6,6,6,6,6,6,6,6,  // d8 - df 
    7,8,8,8,8,8,8,8,  // e0 - e7 
    8,8,8,8,8,9,8,8,  // e8 - ef 
    10,11,11,11,11,11,11,11,  // f0 - f7 
    12,13,13,13,14,15,0,0    // f8 - ff 
];

with( jschardet.Constants )
jschardet.UTF8_st = [
    error,start,error,error,error,error,    12,  10, //00-07 
        9,    11,    8,    7,    6,    5,    4,   3, //08-0f 
    error,error,error,error,error,error,error,error, //10-17 
    error,error,error,error,error,error,error,error, //18-1f 
    itsMe,itsMe,itsMe,itsMe,itsMe,itsMe,itsMe,itsMe, //20-27 
    itsMe,itsMe,itsMe,itsMe,itsMe,itsMe,itsMe,itsMe, //28-2f 
    error,error,    5,    5,    5,    5,error,error, //30-37 
    error,error,error,error,error,error,error,error, //38-3f 
    error,error,error,    5,    5,    5,error,error, //40-47 
    error,error,error,error,error,error,error,error, //48-4f 
    error,error,    7,    7,    7,    7,error,error, //50-57 
    error,error,error,error,error,error,error,error, //58-5f 
    error,error,error,error,    7,    7,error,error, //60-67 
    error,error,error,error,error,error,error,error, //68-6f 
    error,error,    9,    9,    9,    9,error,error, //70-77 
    error,error,error,error,error,error,error,error, //78-7f 
    error,error,error,error,error,    9,error,error, //80-87 
    error,error,error,error,error,error,error,error, //88-8f 
    error,error,   12,   12,   12,   12,error,error, //90-97 
    error,error,error,error,error,error,error,error, //98-9f 
    error,error,error,error,error,   12,error,error, //a0-a7 
    error,error,error,error,error,error,error,error, //a8-af 
    error,error,   12,   12,   12,error,error,error, //b0-b7 
    error,error,error,error,error,error,error,error, //b8-bf 
    error,error,start,start,start,start,error,error, //c0-c7 
    error,error,error,error,error,error,error,error  //c8-cf 
];

jschardet.UTF8CharLenTable = [0, 1, 0, 0, 0, 0, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6];

jschardet.UTF8SMModel = {
    "classTable"    : jschardet.UTF8_cls,
    "classFactor"   : 16,
    "stateTable"    : jschardet.UTF8_st,
    "charLenTable"  : jschardet.UTF8CharLenTable,
    "name"          : "UTF-8"
};

}(jschardet);
}).call(this,require('_process'))
},{"_process":18}],12:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */
 
!function(jschardet) {
    
jschardet.SingleByteCharSetProber = function(model, reversed, nameProber) {
    jschardet.CharSetProber.apply(this);
    
    var SAMPLE_SIZE = 64;
    var SB_ENOUGH_REL_THRESHOLD = 1024;
    var POSITIVE_SHORTCUT_THRESHOLD = 0.95;
    var NEGATIVE_SHORTCUT_THRESHOLD = 0.05;
    var SYMBOL_CAT_ORDER = 250;
    var NUMBER_OF_SEQ_CAT = 4;
    var POSITIVE_CAT = NUMBER_OF_SEQ_CAT - 1;
    //var NEGATIVE_CAT = 0;
    
    var self = this;
    
    function init(model, reversed, nameProber) {
        self._mModel = model;
        self._mReversed = reversed; // "true" if we need to reverse every pair in the model lookup
        self._mNameProber = nameProber; // Optional auxiliary prober for name decision
        self.reset();
    }
    
    this.reset = function() {
        jschardet.SingleByteCharSetProber.prototype.reset.apply(this);
        this._mLastOrder = 255; // char order of last character
        this._mSeqCounters = [];
        for( var i = 0; i < NUMBER_OF_SEQ_CAT; this._mSeqCounters[i++] = 0 );
        this._mTotalSeqs = 0;
        this._mTotalChar = 0;
        this._mFreqChar = 0; // characters that fall in our sampling range
    }
    
    this.getCharsetName = function() {
        if( this._mNameProber ) {
            return this._mNameProber.getCharsetName();
        } else {
            return this._mModel.charsetName;
        }
    }
    
    this.feed = function(aBuf) {
        if( ! this._mModel.keepEnglishLetter ) {
            aBuf = this.filterWithoutEnglishLetters(aBuf);
        }
        var aLen = aBuf.length;
        if( !aLen ) {
            return this.getState();
        }
        for( var i = 0, c; i < aLen; i++ )
        {
            c = aBuf.charCodeAt(i);
            var order = this._mModel.charToOrderMap[c];
            if( order < SYMBOL_CAT_ORDER ) {
                this._mTotalChar++;
            }
            if( order < SAMPLE_SIZE ) {
                this._mFreqChar++;
                if( this._mLastOrder < SAMPLE_SIZE ) {
                    this._mTotalSeqs++;
                    if( !this._mReversed ) {
                        this._mSeqCounters[this._mModel.precedenceMatrix[(this._mLastOrder * SAMPLE_SIZE) + order]]++;
                    } else { // reverse the order of the letters in the lookup
                        this._mSeqCounters[this._mModel.precedenceMatrix[(order * SAMPLE_SIZE) + this._mLastOrder]]++;
                    }
                }
            }
            this._mLastOrder = order;
        }
        
        if( this.getState() == jschardet.Constants.detecting ) {
            if( self._mTotalSeqs > SB_ENOUGH_REL_THRESHOLD ) {
                var cf = this.getConfidence();
                if( cf > POSITIVE_SHORTCUT_THRESHOLD ) {
                    if( jschardet.Constants._debug ) {
                        log(this._mModel.charsetName + " confidence = " + cf + ", we have a winner\n");
                    }
                } else if( cf < NEGATIVE_SHORTCUT_THRESHOLD ) {
                    if( jschardet.Constants._debug ) {
                        log(this._mModel.charsetName + " confidence = " + cf + ", below negative shortcut threshhold " + NEGATIVE_SHORTCUT_THRESHOLD + "\n");
                    }
                    this._mState = jschardet.Constants.notMe;
                }
            }
        }
        
        return this.getState();
    }
    
    this.getConfidence = function() {
        var r = 0.01;
        if( this._mTotalSeqs > 0 ) {
            //log(this._mSeqCounters[POSITIVE_CAT] + " " + this._mTotalSeqs + " " + this._mModel.mTypicalPositiveRatio);
            r = (1.0 * this._mSeqCounters[POSITIVE_CAT]) / this._mTotalSeqs / this._mModel.mTypicalPositiveRatio;
            //log(r + " " + this._mFreqChar + " " + this._mTotalChar);
            r *= this._mFreqChar / this._mTotalChar;
            if( r >= 1.0 ) {
                r = 0.99;
            }
        }
        return r;
    }
    
    reversed = reversed !== undefined ? reversed : false;
    nameProber = nameProber !== undefined ? nameProber : null;
    init(model, reversed, nameProber);
}
jschardet.SingleByteCharSetProber.prototype = new jschardet.CharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":18}],13:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

/**
 * This is a port from the python port, version "2.0.1"
 */

!function(jschardet) {

jschardet.UniversalDetector = function() {
    var MINIMUM_THRESHOLD = 0.20;
    var _state = {
        pureAscii   : 0,
        escAscii    : 1,
        highbyte    : 2
    };
    var self = this;
    
    function init() {
        self._highBitDetector = /[\x80-\xFF]/;
        self._escDetector = /(\x1B|~\{)/;
        self._mEscCharsetProber = null;
        self._mCharsetProbers = [];
        self.reset();
    }
    
    this.reset = function() {
        this.result = {"encoding": null, "confidence": 0.0};
        this.done = false;
        this._mStart = true;
        this._mGotData = false;
        this._mInputState = _state.pureAscii;
        this._mLastChar = "";
        this._mBOM = "";
        if( this._mEscCharsetProber ) {
            this._mEscCharsetProber.reset();
        }
        for( var i = 0, prober; prober = this._mCharsetProbers[i]; i++ ) {
            prober.reset();
        }
    }
    
    this.feed = function(aBuf) {
        if( this.done ) return;
        
        var aLen = aBuf.length;
        if( !aLen ) return;
        
        if( !this._mGotData ) {
            this._mBOM += aBuf;
            // If the data starts with BOM, we know it is UTF
            if( this._mBOM.slice(0,3) == "\xEF\xBB\xBF" ) {
                // EF BB BF  UTF-8 with BOM
                this.result = {"encoding": "UTF-8", "confidence": 1.0};
            } else if( this._mBOM.slice(0,4) == "\xFF\xFE\x00\x00" ) {
                // FF FE 00 00  UTF-32, little-endian BOM
                this.result = {"encoding": "UTF-32LE", "confidence": 1.0};
            } else if( this._mBOM.slice(0,4) == "\x00\x00\xFE\xFF" ) {
                // 00 00 FE FF  UTF-32, big-endian BOM
                this.result = {"encoding": "UTF-32BE", "confidence": 1.0};
            } else if( this._mBOM.slice(0,4) == "\xFE\xFF\x00\x00" ) {
                // FE FF 00 00  UCS-4, unusual octet order BOM (3412)
                this.result = {"encoding": "X-ISO-10646-UCS-4-3412", "confidence": 1.0};
            } else if( this._mBOM.slice(0,4) == "\x00\x00\xFF\xFE" ) {
                // 00 00 FF FE  UCS-4, unusual octet order BOM (2143)
                this.result = {"encoding": "X-ISO-10646-UCS-4-2143", "confidence": 1.0};
            } else if( this._mBOM.slice(0,2) == "\xFF\xFE" ) {
                // FF FE  UTF-16, little endian BOM
                this.result = {"encoding": "UTF-16LE", "confidence": 1.0};
            } else if( this._mBOM.slice(0,2) == "\xFE\xFF" ) {
                // FE FF  UTF-16, big endian BOM
                this.result = {"encoding": "UTF-16BE", "confidence": 1.0};
            }

            // If we got to 4 chars without being able to detect a BOM we
            // stop trying.
            if( this._mBOM.length > 3 ) {
                this._mGotData = true;
            }
        }

        if( this.result.encoding && (this.result.confidence > 0.0) ) {
            this.done = true;
            return;
        }
        
        if( this._mInputState == _state.pureAscii ) {
            if( this._highBitDetector.test(aBuf) ) {
                this._mInputState = _state.highbyte;
            } else if( this._escDetector.test(this._mLastChar + aBuf) ) {
                this._mInputState = _state.escAscii;
            }
        }
        
        this._mLastChar = aBuf.slice(-1);
        
        if( this._mInputState == _state.escAscii ) {
            if( !this._mEscCharsetProber ) {
                this._mEscCharsetProber = new jschardet.EscCharSetProber();
            }
            if( this._mEscCharsetProber.feed(aBuf) == jschardet.Constants.foundIt ) {
                this.result = {
                    "encoding": this._mEscCharsetProber.getCharsetName(),
                    "confidence": this._mEscCharsetProber.getConfidence()
                };
                this.done = true;
            }
        } else if( this._mInputState == _state.highbyte ) {
            if( this._mCharsetProbers.length == 0 ) {
                this._mCharsetProbers = [
                    new jschardet.MBCSGroupProber(),
                    new jschardet.Latin1Prober()
                ];
            }
            for( var i = 0, prober; prober = this._mCharsetProbers[i]; i++ ) {
                if( prober.feed(aBuf) == jschardet.Constants.foundIt ) {
                    this.result = {
                        "encoding": prober.getCharsetName(),
                        "confidence": prober.getConfidence()
                    };
                    this.done = true;
                    break;
                }
            }
        }
    }
    
    this.close = function() {
        if( this.done ) return;
        if( this._mBOM.length === 0 ) {
            if( jschardet.Constants._debug ) {
                console.log("no data received!\n");
            }
            return;
        }
        this.done = true;
        
        if( this._mInputState == _state.pureAscii ) {
            if( jschardet.Constants._debug ) {
                console.log("pure ascii")
            }
            this.result = {"encoding": "ascii", "confidence": 1.0};
            return this.result;
        }
        
        if( this._mInputState == _state.highbyte ) {
            var proberConfidence = null;
            var maxProberConfidence = 0.0;
            var maxProber = null;
            for( var i = 0, prober; prober = this._mCharsetProbers[i]; i++ ) {
                if( !prober ) continue;
                proberConfidence = prober.getConfidence();
                if( proberConfidence > maxProberConfidence ) {
                    maxProberConfidence = proberConfidence;
                    maxProber = prober;
                }
                if( jschardet.Constants._debug ) {
                    console.log(prober.getCharsetName() + " confidence " + prober.getConfidence());
                }
            }
            if( maxProber && maxProberConfidence > MINIMUM_THRESHOLD ) {
                this.result = {
                    "encoding": maxProber.getCharsetName(),
                    "confidence": maxProber.getConfidence()
                };
                return this.result;
            }
        }
        
        if( jschardet.Constants._debug ) {
            console.log("no probers hit minimum threshhold\n");
            for( var i = 0, prober; prober = this._mCharsetProbers[i]; i++ ) {
                if( !prober ) continue;
                console.log(prober.getCharsetName() + " confidence = " +
                    prober.getConfidence() + "\n");
            }
        }
    }
    
    init();
}

}(jschardet);

}).call(this,require('_process'))
},{"_process":18}],14:[function(require,module,exports){
(function (process){
/*
 * The Original Code is Mozilla Universal charset detector code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2001
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   António Afonso (antonio.afonso gmail.com) - port to JavaScript
 *   Mark Pilgrim - port to Python
 *   Shy Shalom - original C code
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

!function(jschardet) {

jschardet.UTF8Prober = function() {
    jschardet.CharSetProber.apply(this);
    
    var ONE_CHAR_PROB = 0.5;
    var self = this;
    
    function init() {
        self._mCodingSM = new jschardet.CodingStateMachine(jschardet.UTF8SMModel);
        self.reset();
    }
    
    this.reset = function() {
        jschardet.UTF8Prober.prototype.reset.apply(this);
        this._mCodingSM.reset();
        this._mNumOfMBChar = 0;
    }
    
    this.getCharsetName = function() {
        return "utf-8";
    }
    
    this.feed = function(aBuf) {
        for( var i = 0, c; i < aBuf.length; i++ ) {
            c = aBuf[i];
            var codingState = this._mCodingSM.nextState(c);
            if( codingState == jschardet.Constants.error ) {
                this._mState = jschardet.Constants.notMe;
                break;
            } else if( codingState == jschardet.Constants.itsMe ) {
                this._mState = jschardet.Constants.foundIt;
                break;
            } else if( codingState == jschardet.Constants.start ) {
                if( this._mCodingSM.getCurrentCharLen() >= 2 ) {
                    this._mNumOfMBChar++;
                }
            }
        }
        
        if( this.getState() == jschardet.Constants.detecting ) {
            if( this.getConfidence() > jschardet.Constants.SHORTCUT_THRESHOLD ) {
                this._mState = jschardet.Constants.foundIt;
            }
        }
        
        return this.getState();
    }
    
    this.getConfidence = function() {
        var unlike = 0.99;
        if( this._mNumOfMBChar < 6 ) {
            for( var i = 0; i < this._mNumOfMBChar; i++ ) {
                unlike *= ONE_CHAR_PROB;
            }
            return 1 - unlike;
        } else {
            return unlike;
        }
    }
    
    init();
}
jschardet.UTF8Prober.prototype = new jschardet.CharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":18}],15:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
var TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    if (encoding === 'base64')
      subject = base64clean(subject)
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str.toString()
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.compare = function (a, b) {
  assert(Buffer.isBuffer(a) && Buffer.isBuffer(b), 'Arguments must be Buffers')
  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) {
    return -1
  }
  if (y < x) {
    return 1
  }
  return 0
}

// BUFFER INSTANCE METHODS
// =======================

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end === undefined) ? self.length : Number(end)

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = asciiSlice(self, start, end)
      break
    case 'binary':
      ret = binarySlice(self, start, end)
      break
    case 'base64':
      ret = base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

Buffer.prototype.equals = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.compare = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  if (TYPED_ARRAY_SUPPORT) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return readUInt16(this, offset, false, noAssert)
}

function readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return readInt16(this, offset, false, noAssert)
}

function readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return readInt32(this, offset, false, noAssert)
}

function readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return readFloat(this, offset, false, noAssert)
}

function readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
  return offset + 1
}

function writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
  return offset + 2
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, false, noAssert)
}

function writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
  return offset + 4
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
  return offset + 1
}

function writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
  return offset + 2
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, false, noAssert)
}

function writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
  return offset + 4
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, false, noAssert)
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":16,"ieee754":17}],16:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],17:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],18:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[1]);
