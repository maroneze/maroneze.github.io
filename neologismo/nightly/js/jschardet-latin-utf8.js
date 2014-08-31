/** Code adapted from jschardet by António Afonso, browserify-ed.
    I'm only concerned with ISO-8859 and UTF-8, 
    therefore many probers have been removed to improve performance
    and to avoid incorrect detections (such as IBM855 and MacCyrillic).
**/

// TODO: remove dead code and minify

var jschardet = {};

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./src')
},{"./src":19}],2:[function(require,module,exports){
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
    
// Big5 frequency table
// by Taiwan's Mandarin Promotion Council 
// <http://www.edu.tw:81/mandr/>
// 
// 128  --> 0.42261
// 256  --> 0.57851
// 512  --> 0.74851
// 1024 --> 0.89384
// 2048 --> 0.97583
// 
// Ideal Distribution Ratio = 0.74851/(1-0.74851) =2.98
// Random Distribution Ration = 512/(5401-512)=0.105
// 
// Typical Distribution Ratio about 25% of Ideal one, still much higher than RDR

jschardet.BIG5_TYPICAL_DISTRIBUTION_RATIO = 0.75;

//Char to FreqOrder table
jschardet.BIG5_TABLE_SIZE = 5376;

jschardet.Big5CharToFreqOrder = []; //13973

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],3:[function(require,module,exports){
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
    
jschardet.Big5Prober = function() {
    jschardet.MultiByteCharSetProber.apply(this);
    
    var self = this;
    
    function init() {
        self._mCodingSM = new jschardet.CodingStateMachine(jschardet.Big5SMModel);
        self._mDistributionAnalyzer = new jschardet.Big5DistributionAnalysis();
        self.reset();
    }
    
    this.getCharsetName = function() {
        return "Big5";
    }
    
    init();
}
jschardet.Big5Prober.prototype = new jschardet.MultiByteCharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],4:[function(require,module,exports){
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
    
jschardet.CharDistributionAnalysis = function() {
    var ENOUGH_DATA_THRESHOLD = 1024;
    var SURE_YES = 0.99;
    var SURE_NO = 0.01;
    var self = this;
    
    function init() {
        self._mCharToFreqOrder = null; // Mapping table to get frequency order from char order (get from GetOrder())
        self._mTableSize = null; // Size of above table
        self._mTypicalDistributionRatio = null; // This is a constant value which varies from language to language, used in calculating confidence.  See http://www.mozilla.org/projects/intl/UniversalCharsetDetection.html for further detail.
        self.reset();
    }
    
    /**
     * reset analyser, clear any state
     */
    this.reset = function() {
        this._mDone = false; // If this flag is set to constants.True, detection is done and conclusion has been made
        this._mTotalChars = 0; // Total characters encountered
        this._mFreqChars = 0; // The number of characters whose frequency order is less than 512
    }
    
    /**
     * feed a character with known length
     */
    this.feed = function(aStr, aCharLen) {
        if( aCharLen == 2 ) {
            // we only care about 2-bytes character in our distribution analysis
            var order = this.getOrder(aStr);
        } else {
            order = -1;
        }
        if( order >= 0 ) {
            this._mTotalChars++;
            // order is valid
            if( order < this._mTableSize ) {
                if( 512 > this._mCharToFreqOrder[order] ) {
                    this._mFreqChars++;
                }
            }
        }
    }
    
    /**
     * return confidence based on existing data
     */
    this.getConfidence = function() {
        // if we didn't receive any character in our consideration range, return negative answer
        if( this._mTotalChars <= 0 ) {
            return SURE_NO;
        }
        if( this._mTotalChars != this._mFreqChars ) {
            var r = this._mFreqChars / ((this._mTotalChars - this._mFreqChars) * this._mTypicalDistributionRatio);
            if( r < SURE_YES ) {
                return r;
            }
        }
        
        // normalize confidence (we don't want to be 100% sure)
        return SURE_YES;
    }
    
    this.gotEnoughData = function() {
        // It is not necessary to receive all data to draw conclusion. For charset detection,
        // certain amount of data is enough
        return this._mTotalChars > ENOUGH_DATA_THRESHOLD;
    }
    
    this.getOrder = function(aStr) {
        // We do not handle characters based on the original encoding string, but 
        // convert this encoding string to a number, here called order.
        // This allows multiple encodings of a language to share one frequency table.
        return -1;
    }
    
    init();
}

jschardet.EUCTWDistributionAnalysis = function() {
    jschardet.CharDistributionAnalysis.apply(this);
    
    var self = this;
    
    function init() {
        self._mCharToFreqOrder = jschardet.EUCTWCharToFreqOrder;
        self._mTableSize = jschardet.EUCTW_TABLE_SIZE;
        self._mTypicalDistributionRatio = jschardet.EUCTW_TYPICAL_DISTRIBUTION_RATIO;
    }
    
    this.getOrder = function(aStr) {
        // for euc-TW encoding, we are interested 
        //   first  byte range: 0xc4 -- 0xfe
        //   second byte range: 0xa1 -- 0xfe
        // no validation needed here. State machine has done that
        if( aStr.charCodeAt(0) >= 0xC4 ) {
            return 94 * (aStr.charCodeAt(0) - 0xC4) + aStr.charCodeAt(1) - 0xA1;
        } else {
            return -1;
        }
    }
    
    init();
}
jschardet.EUCTWDistributionAnalysis.prototype = new jschardet.CharDistributionAnalysis();

jschardet.EUCKRDistributionAnalysis = function() {
    jschardet.CharDistributionAnalysis.apply(this);
    
    var self = this;
    
    function init() {
        self._mCharToFreqOrder = jschardet.EUCKRCharToFreqOrder;
        self._mTableSize = jschardet.EUCKR_TABLE_SIZE;
        self._mTypicalDistributionRatio = jschardet.EUCKR_TYPICAL_DISTRIBUTION_RATIO;
    }
    
    this.getOrder = function(aStr) {
        // for euc-KR encoding, we are interested 
        //   first  byte range: 0xb0 -- 0xfe
        //   second byte range: 0xa1 -- 0xfe
        // no validation needed here. State machine has done that
        if( aStr.charCodeAt(0) >= 0xB0 ) {
            return 94 * (aStr.charCodeAt(0) - 0xB0) + aStr.charCodeAt(1) - 0xA1;
        } else {
            return -1;
        }
    }
    
    init();
}
jschardet.EUCKRDistributionAnalysis.prototype = new jschardet.CharDistributionAnalysis();

jschardet.GB2312DistributionAnalysis = function() {
    jschardet.CharDistributionAnalysis.apply(this);
    
    var self = this;
    
    function init() {
        self._mCharToFreqOrder = jschardet.GB2312CharToFreqOrder;
        self._mTableSize = jschardet.GB2312_TABLE_SIZE;
        self._mTypicalDistributionRatio = jschardet.GB2312_TYPICAL_DISTRIBUTION_RATIO;
    }
    
    this.getOrder = function(aStr) {
        // for GB2312 encoding, we are interested
        //  first  byte range: 0xb0 -- 0xfe
        //  second byte range: 0xa1 -- 0xfe
        // no validation needed here. State machine has done that
        if( aStr.charCodeAt(0) >= 0xB0 && aStr.charCodeAt(1) >= 0xA1 ) {
            return 94 * (aStr.charCodeAt(0) - 0xB0) + aStr.charCodeAt(1) - 0xA1;
        } else {
            return -1;
        }
    }
    
    init();
}
jschardet.GB2312DistributionAnalysis.prototype = new jschardet.CharDistributionAnalysis();

jschardet.Big5DistributionAnalysis = function() {
    jschardet.CharDistributionAnalysis.apply(this);
    
    var self = this;
    
    function init() {
        self._mCharToFreqOrder = jschardet.Big5CharToFreqOrder;
        self._mTableSize = jschardet.BIG5_TABLE_SIZE;
        self._mTypicalDistributionRatio = jschardet.BIG5_TYPICAL_DISTRIBUTION_RATIO;
    }
    
    this.getOrder = function(aStr) {
        // for big5 encoding, we are interested 
        //   first  byte range: 0xa4 -- 0xfe
        //   second byte range: 0x40 -- 0x7e , 0xa1 -- 0xfe
        // no validation needed here. State machine has done that
        if( aStr.charCodeAt(0) >= 0xA4 ) {
            if( aStr.charCodeAt(1) >= 0xA1 ) {
                return 157 * (aStr.charCodeAt(0) - 0xA4) + aStr.charCodeAt(1) - 0xA1 + 63;
            } else {
                return 157 * (aStr.charCodeAt(0) - 0xA4) + aStr.charCodeAt(1) - 0x40;
            }
        } else {
            return -1;
        }
    }
    
    init();
}
jschardet.Big5DistributionAnalysis.prototype = new jschardet.CharDistributionAnalysis();

jschardet.SJISDistributionAnalysis = function() {
    jschardet.CharDistributionAnalysis.apply(this);
    
    var self = this;
    
    function init() {
        self._mCharToFreqOrder = jschardet.JISCharToFreqOrder;
        self._mTableSize = jschardet.JIS_TABLE_SIZE;
        self._mTypicalDistributionRatio = jschardet.JIS_TYPICAL_DISTRIBUTION_RATIO;
    }
    
    this.getOrder = function(aStr) {
        // for sjis encoding, we are interested 
        //   first  byte range: 0x81 -- 0x9f , 0xe0 -- 0xfe
        //   second byte range: 0x40 -- 0x7e,  0x81 -- 0xfe
        // no validation needed here. State machine has done that
        if( aStr.charCodeAt(0) >= 0x81 && aStr.charCodeAt(0) <= 0x9F ) {
            var order = 188 * (aStr.charCodeAt(0) - 0x81);
        } else if( aStr.charCodeAt(0) >= 0xE0 && aStr.charCodeAt(0) <= 0xEF ) {
            order = 188 * (aStr.charCodeAt(0) - 0xE0 + 31);
        } else {
            return -1;
        }
        order += aStr.charCodeAt(1) - 0x40;
        if( aStr.charCodeAt(1) > 0x7F ) {
            order = -1;
        }
        return order;
    }
    
    init();
}
jschardet.SJISDistributionAnalysis.prototype = new jschardet.CharDistributionAnalysis();

jschardet.EUCJPDistributionAnalysis = function() {
    jschardet.CharDistributionAnalysis.apply(this);
    
    var self = this;
    
    function init() {
        self._mCharToFreqOrder = jschardet.JISCharToFreqOrder;
        self._mTableSize = jschardet.JIS_TABLE_SIZE;
        self._mTypicalDistributionRatio = jschardet.JIS_TYPICAL_DISTRIBUTION_RATIO;
    }
    
    this.getOrder = function(aStr) {
        // for euc-JP encoding, we are interested 
        //   first  byte range: 0xa0 -- 0xfe
        //   second byte range: 0xa1 -- 0xfe
        // no validation needed here. State machine has done that
        if( aStr[0] >= "\xA0" ) {
            return 94 * (aStr.charCodeAt(0) - 0xA1) + aStr.charCodeAt(1) - 0xA1;
        } else {
            return -1;
        }
    }
    
    init();
}
jschardet.EUCJPDistributionAnalysis.prototype = new jschardet.CharDistributionAnalysis();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],5:[function(require,module,exports){
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
},{"_process":41}],6:[function(require,module,exports){
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
},{"_process":41}],7:[function(require,module,exports){
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
},{"_process":41}],8:[function(require,module,exports){
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
},{"_process":41}],9:[function(require,module,exports){
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
    
jschardet.EscCharSetProber = function() {
    jschardet.CharSetProber.apply(this);
    
    var self = this;
    
    function init() {
        self._mCodingSM = [
            new jschardet.CodingStateMachine(jschardet.HZSMModel),
            new jschardet.CodingStateMachine(jschardet.ISO2022CNSMModel),
            new jschardet.CodingStateMachine(jschardet.ISO2022JPSMModel),
            new jschardet.CodingStateMachine(jschardet.ISO2022KRSMModel)
        ];
        self.reset();
    }
    
    this.reset = function() {
        jschardet.EscCharSetProber.prototype.reset.apply(this);
        for( var i = 0, codingSM; codingSM = this._mCodingSM[i]; i++ ) {
            if( !codingSM ) continue;
            codingSM.active = true;
            codingSM.reset();
        }
        this._mActiveSM = self._mCodingSM.length;
        this._mDetectedCharset = null;
    }
    
    this.getCharsetName = function() {
        return this._mDetectedCharset;
    }
    
    this.getConfidence = function() {
        if( this._mDetectedCharset ) {
            return 0.99;
        } else {
            return 0.00;
        }
    }
    
    this.feed = function(aBuf) {
        for( var i = 0, c; i < aBuf.length; i++ ) {
            c = aBuf[i];
            for( var j = 0, codingSM; codingSM = this._mCodingSM[j]; j++ ) {
                if( !codingSM || !codingSM.active ) continue;
                var codingState = codingSM.nextState(c);
                if( codingState == jschardet.Constants.error ) {
                    codingSM.active = false;
                    this._mActiveSM--;
                    if( this._mActiveSM <= 0 ) {
                        this._mState = jschardet.Constants.notMe;
                        return this.getState();
                    }
                } else if( codingState == jschardet.Constants.itsMe ) {
                    this._mState = jschardet.Constants.foundIt;
                    this._mDetectedCharset = codingSM.getCodingStateMachine();
                    return this.getState();
                }
            }
        }
        
        return this.getState();
    }
    
    init();
}
jschardet.EscCharSetProber.prototype = new jschardet.CharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],10:[function(require,module,exports){
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
    
jschardet.HZ_cls = [
    1,0,0,0,0,0,0,0,  // 00 - 07 
    0,0,0,0,0,0,0,0,  // 08 - 0f 
    0,0,0,0,0,0,0,0,  // 10 - 17 
    0,0,0,1,0,0,0,0,  // 18 - 1f 
    0,0,0,0,0,0,0,0,  // 20 - 27 
    0,0,0,0,0,0,0,0,  // 28 - 2f 
    0,0,0,0,0,0,0,0,  // 30 - 37 
    0,0,0,0,0,0,0,0,  // 38 - 3f 
    0,0,0,0,0,0,0,0,  // 40 - 47 
    0,0,0,0,0,0,0,0,  // 48 - 4f 
    0,0,0,0,0,0,0,0,  // 50 - 57 
    0,0,0,0,0,0,0,0,  // 58 - 5f 
    0,0,0,0,0,0,0,0,  // 60 - 67 
    0,0,0,0,0,0,0,0,  // 68 - 6f 
    0,0,0,0,0,0,0,0,  // 70 - 77 
    0,0,0,4,0,5,2,0,  // 78 - 7f 
    1,1,1,1,1,1,1,1,  // 80 - 87 
    1,1,1,1,1,1,1,1,  // 88 - 8f 
    1,1,1,1,1,1,1,1,  // 90 - 97 
    1,1,1,1,1,1,1,1,  // 98 - 9f 
    1,1,1,1,1,1,1,1,  // a0 - a7 
    1,1,1,1,1,1,1,1,  // a8 - af 
    1,1,1,1,1,1,1,1,  // b0 - b7 
    1,1,1,1,1,1,1,1,  // b8 - bf 
    1,1,1,1,1,1,1,1,  // c0 - c7 
    1,1,1,1,1,1,1,1,  // c8 - cf 
    1,1,1,1,1,1,1,1,  // d0 - d7 
    1,1,1,1,1,1,1,1,  // d8 - df 
    1,1,1,1,1,1,1,1,  // e0 - e7 
    1,1,1,1,1,1,1,1,  // e8 - ef 
    1,1,1,1,1,1,1,1,  // f0 - f7 
    1,1,1,1,1,1,1,1   // f8 - ff 
];

with( jschardet.Constants )
jschardet.HZ_st = [
    start,error,    3,start,start,start,error,error, // 00-07 
    error,error,error,error,itsMe,itsMe,itsMe,itsMe, // 08-0f 
    itsMe,itsMe,error,error,start,start,    4,error, // 10-17 
        5,error,    6,error,    5,    5,    4,error, // 18-1f 
        4,error,    4,    4,    4,error,    4,error, // 20-27 
        4,itsMe,start,start,start,start,start,start  // 28-2f 
];
    
jschardet.HZCharLenTable = [0, 0, 0, 0, 0, 0];
    
jschardet.HZSMModel = {
    "classTable"    : jschardet.HZ_cls,
    "classFactor"   : 6,
    "stateTable"    : jschardet.HZ_st,
    "charLenTable"  : jschardet.HZCharLenTable,
    "name"          : "HZ-GB-2312"
};

jschardet.ISO2022CN_cls = [
    2,0,0,0,0,0,0,0,  // 00 - 07 
    0,0,0,0,0,0,0,0,  // 08 - 0f 
    0,0,0,0,0,0,0,0,  // 10 - 17 
    0,0,0,1,0,0,0,0,  // 18 - 1f 
    0,0,0,0,0,0,0,0,  // 20 - 27 
    0,3,0,0,0,0,0,0,  // 28 - 2f 
    0,0,0,0,0,0,0,0,  // 30 - 37 
    0,0,0,0,0,0,0,0,  // 38 - 3f 
    0,0,0,4,0,0,0,0,  // 40 - 47 
    0,0,0,0,0,0,0,0,  // 48 - 4f 
    0,0,0,0,0,0,0,0,  // 50 - 57 
    0,0,0,0,0,0,0,0,  // 58 - 5f 
    0,0,0,0,0,0,0,0,  // 60 - 67 
    0,0,0,0,0,0,0,0,  // 68 - 6f 
    0,0,0,0,0,0,0,0,  // 70 - 77 
    0,0,0,0,0,0,0,0,  // 78 - 7f 
    2,2,2,2,2,2,2,2,  // 80 - 87 
    2,2,2,2,2,2,2,2,  // 88 - 8f 
    2,2,2,2,2,2,2,2,  // 90 - 97 
    2,2,2,2,2,2,2,2,  // 98 - 9f 
    2,2,2,2,2,2,2,2,  // a0 - a7 
    2,2,2,2,2,2,2,2,  // a8 - af 
    2,2,2,2,2,2,2,2,  // b0 - b7 
    2,2,2,2,2,2,2,2,  // b8 - bf 
    2,2,2,2,2,2,2,2,  // c0 - c7 
    2,2,2,2,2,2,2,2,  // c8 - cf 
    2,2,2,2,2,2,2,2,  // d0 - d7 
    2,2,2,2,2,2,2,2,  // d8 - df 
    2,2,2,2,2,2,2,2,  // e0 - e7 
    2,2,2,2,2,2,2,2,  // e8 - ef 
    2,2,2,2,2,2,2,2,  // f0 - f7 
    2,2,2,2,2,2,2,2   // f8 - ff 
];

with( jschardet.Constants )
jschardet.ISO2022CN_st = [
    start,    3,error,start,start,start,start,start, // 00-07 
    start,error,error,error,error,error,error,error, // 08-0f 
    error,error,itsMe,itsMe,itsMe,itsMe,itsMe,itsMe, // 10-17 
    itsMe,itsMe,itsMe,error,error,error,    4,error, // 18-1f 
    error,error,error,itsMe,error,error,error,error, // 20-27 
        5,    6,error,error,error,error,error,error, // 28-2f 
    error,error,error,itsMe,error,error,error,error, // 30-37 
    error,error,error,error,error,itsMe,error,start  // 38-3f 
];

jschardet.ISO2022CNCharLenTable = [0, 0, 0, 0, 0, 0, 0, 0, 0];

jschardet.ISO2022CNSMModel = {
    "classTable"    : jschardet.ISO2022CN_cls,
    "classFactor"   : 9,
    "stateTable"    : jschardet.ISO2022CN_st,
    "charLenTable"  : jschardet.ISO2022CNCharLenTable,
    "name"          : "ISO-2022-CN"
};

jschardet.ISO2022JP_cls = [
    2,0,0,0,0,0,0,0,  // 00 - 07 
    0,0,0,0,0,0,2,2,  // 08 - 0f 
    0,0,0,0,0,0,0,0,  // 10 - 17 
    0,0,0,1,0,0,0,0,  // 18 - 1f 
    0,0,0,0,7,0,0,0,  // 20 - 27 
    3,0,0,0,0,0,0,0,  // 28 - 2f 
    0,0,0,0,0,0,0,0,  // 30 - 37 
    0,0,0,0,0,0,0,0,  // 38 - 3f 
    6,0,4,0,8,0,0,0,  // 40 - 47 
    0,9,5,0,0,0,0,0,  // 48 - 4f 
    0,0,0,0,0,0,0,0,  // 50 - 57 
    0,0,0,0,0,0,0,0,  // 58 - 5f 
    0,0,0,0,0,0,0,0,  // 60 - 67 
    0,0,0,0,0,0,0,0,  // 68 - 6f 
    0,0,0,0,0,0,0,0,  // 70 - 77 
    0,0,0,0,0,0,0,0,  // 78 - 7f 
    2,2,2,2,2,2,2,2,  // 80 - 87 
    2,2,2,2,2,2,2,2,  // 88 - 8f 
    2,2,2,2,2,2,2,2,  // 90 - 97 
    2,2,2,2,2,2,2,2,  // 98 - 9f 
    2,2,2,2,2,2,2,2,  // a0 - a7 
    2,2,2,2,2,2,2,2,  // a8 - af 
    2,2,2,2,2,2,2,2,  // b0 - b7 
    2,2,2,2,2,2,2,2,  // b8 - bf 
    2,2,2,2,2,2,2,2,  // c0 - c7 
    2,2,2,2,2,2,2,2,  // c8 - cf 
    2,2,2,2,2,2,2,2,  // d0 - d7 
    2,2,2,2,2,2,2,2,  // d8 - df 
    2,2,2,2,2,2,2,2,  // e0 - e7 
    2,2,2,2,2,2,2,2,  // e8 - ef 
    2,2,2,2,2,2,2,2,  // f0 - f7 
    2,2,2,2,2,2,2,2   // f8 - ff 
];

with( jschardet.Constants )
jschardet.ISO2022JP_st = [
    start,    3,error,start,start,start,start,start, // 00-07 
    start,start,error,error,error,error,error,error, // 08-0f 
    error,error,error,error,itsMe,itsMe,itsMe,itsMe, // 10-17 
    itsMe,itsMe,itsMe,itsMe,itsMe,itsMe,error,error, // 18-1f 
    error,    5,error,error,error,    4,error,error, // 20-27 
    error,error,error,    6,itsMe,error,itsMe,error, // 28-2f 
    error,error,error,error,error,error,itsMe,itsMe, // 30-37 
    error,error,error,itsMe,error,error,error,error, // 38-3f 
    error,error,error,error,itsMe,error,start,start  // 40-47 
];

jschardet.ISO2022JPCharLenTable = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

jschardet.ISO2022JPSMModel = {
    "classTable"    : jschardet.ISO2022JP_cls,
    "classFactor"   : 10,
    "stateTable"    : jschardet.ISO2022JP_st,
    "charLenTable"  : jschardet.ISO2022JPCharLenTable,
    "name"          : "ISO-2022-JP"
};

jschardet.ISO2022KR_cls = [
    2,0,0,0,0,0,0,0,  // 00 - 07 
    0,0,0,0,0,0,0,0,  // 08 - 0f 
    0,0,0,0,0,0,0,0,  // 10 - 17 
    0,0,0,1,0,0,0,0,  // 18 - 1f 
    0,0,0,0,3,0,0,0,  // 20 - 27 
    0,4,0,0,0,0,0,0,  // 28 - 2f 
    0,0,0,0,0,0,0,0,  // 30 - 37 
    0,0,0,0,0,0,0,0,  // 38 - 3f 
    0,0,0,5,0,0,0,0,  // 40 - 47 
    0,0,0,0,0,0,0,0,  // 48 - 4f 
    0,0,0,0,0,0,0,0,  // 50 - 57 
    0,0,0,0,0,0,0,0,  // 58 - 5f 
    0,0,0,0,0,0,0,0,  // 60 - 67 
    0,0,0,0,0,0,0,0,  // 68 - 6f 
    0,0,0,0,0,0,0,0,  // 70 - 77 
    0,0,0,0,0,0,0,0,  // 78 - 7f 
    2,2,2,2,2,2,2,2,  // 80 - 87 
    2,2,2,2,2,2,2,2,  // 88 - 8f 
    2,2,2,2,2,2,2,2,  // 90 - 97 
    2,2,2,2,2,2,2,2,  // 98 - 9f 
    2,2,2,2,2,2,2,2,  // a0 - a7 
    2,2,2,2,2,2,2,2,  // a8 - af 
    2,2,2,2,2,2,2,2,  // b0 - b7 
    2,2,2,2,2,2,2,2,  // b8 - bf 
    2,2,2,2,2,2,2,2,  // c0 - c7 
    2,2,2,2,2,2,2,2,  // c8 - cf 
    2,2,2,2,2,2,2,2,  // d0 - d7 
    2,2,2,2,2,2,2,2,  // d8 - df 
    2,2,2,2,2,2,2,2,  // e0 - e7 
    2,2,2,2,2,2,2,2,  // e8 - ef 
    2,2,2,2,2,2,2,2,  // f0 - f7 
    2,2,2,2,2,2,2,2   // f8 - ff 
];

with( jschardet.Constants )
jschardet.ISO2022KR_st = [
    start,    3,error,start,start,start,error,error, // 00-07 
    error,error,error,error,itsMe,itsMe,itsMe,itsMe, // 08-0f 
    itsMe,itsMe,error,error,error,    4,error,error, // 10-17 
    error,error,error,error,    5,error,error,error, // 18-1f 
    error,error,error,itsMe,start,start,start,start  // 20-27 
];

jschardet.ISO2022KRCharLenTable = [0, 0, 0, 0, 0, 0];

jschardet.ISO2022KRSMModel = {
    "classTable"    : jschardet.ISO2022KR_cls,
    "classFactor"   : 6,
    "stateTable"    : jschardet.ISO2022KR_st,
    "charLenTable"  : jschardet.ISO2022KRCharLenTable,
    "name"          : "ISO-2022-KR"
};

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],11:[function(require,module,exports){
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
    
jschardet.EUCJPProber = function() {
    jschardet.MultiByteCharSetProber.apply(this);
    
    var self = this;
    
    function init() {
        self._mCodingSM = new jschardet.CodingStateMachine(jschardet.EUCJPSMModel);
        self._mDistributionAnalyzer = new jschardet.EUCJPDistributionAnalysis();
        self._mContextAnalyzer = new jschardet.EUCJPContextAnalysis();
        self.reset();
    }
    
    this.reset = function() {
        jschardet.EUCJPProber.prototype.reset.apply(this);
        this._mContextAnalyzer.reset();
    }
    
    this.getCharsetName = function() {
        return "EUC-JP";
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
                    this._mContextAnalyzer.feed(this._mLastChar, charLen);
                    this._mDistributionAnalyzer.feed(this._mLastChar, charLen);
                } else {
                    this._mContextAnalyzer.feed(aBuf.slice(i-1,i+1), charLen);
                    this._mDistributionAnalyzer.feed(aBuf.slice(i-1,i+1), charLen);
                }
            }
        }
        
        this._mLastChar[0] = aBuf[aLen - 1];
        
        if( this.getState() == jschardet.Constants.detecting ) {
            if( this._mContextAnalyzer.gotEnoughData() && 
                this.getConfidence() > jschardet.Constants.SHORTCUT_THRESHOLD ) {
                this._mState = jschardet.Constants.foundIt;
            }
        }
        
        return this.getState();
    }
    
    this.getConfidence = function() {
        var contxtCf = this._mContextAnalyzer.getConfidence();
        var distribCf = this._mDistributionAnalyzer.getConfidence();
        
        return Math.max(contxtCf, distribCf);
    }
    
    init();
}
jschardet.EUCJPProber.prototype = new jschardet.MultiByteCharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],12:[function(require,module,exports){
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
    
// Sampling from about 20M text materials include literature and computer technology

// 128  --> 0.79
// 256  --> 0.92
// 512  --> 0.986
// 1024 --> 0.99944
// 2048 --> 0.99999
//
// Idea Distribution Ratio = 0.98653 / (1-0.98653) = 73.24
// Random Distribution Ration = 512 / (2350-512) = 0.279.
// 
// Typical Distribution Ratio  

jschardet.EUCKR_TYPICAL_DISTRIBUTION_RATIO = 6.0;

jschardet.EUCKR_TABLE_SIZE = 2352;

// Char to FreqOrder table , 
jschardet.EUCKRCharToFreqOrder = [];

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],13:[function(require,module,exports){
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
    
jschardet.EUCKRProber = function() {
    jschardet.MultiByteCharSetProber.apply(this);
    
    var self = this;
    
    function init() {
        self._mCodingSM = new jschardet.CodingStateMachine(jschardet.EUCKRSMModel);
        self._mDistributionAnalyzer = new jschardet.EUCKRDistributionAnalysis();
        self.reset();
    }
    
    this.getCharsetName = function() {
        return "EUC-KR";
    }
    
    init();
}
jschardet.EUCKRProber.prototype = new jschardet.MultiByteCharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],14:[function(require,module,exports){
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
    
// EUCTW frequency table
// Converted from big5 work 
// by Taiwan's Mandarin Promotion Council 
// <http://www.edu.tw:81/mandr/>

// 128  --> 0.42261
// 256  --> 0.57851
// 512  --> 0.74851
// 1024 --> 0.89384
// 2048 --> 0.97583
//
// Idea Distribution Ratio = 0.74851/(1-0.74851) =2.98
// Random Distribution Ration = 512/(5401-512)=0.105
// 
// Typical Distribution Ratio about 25% of Ideal one, still much higher than RDR

jschardet.EUCTW_TYPICAL_DISTRIBUTION_RATIO = 0.75;

// Char to FreqOrder table , 
jschardet.EUCTW_TABLE_SIZE = 8102;

jschardet.EUCTWCharToFreqOrder = []; // 8742

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],15:[function(require,module,exports){
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
    
jschardet.EUCTWProber = function() {
    jschardet.MultiByteCharSetProber.apply(this);
    
    var self = this;
    
    function init() {
        self._mCodingSM = new jschardet.CodingStateMachine(jschardet.EUCTWSMModel);
        self._mDistributionAnalyzer = new jschardet.EUCTWDistributionAnalysis();
        self.reset();
    }
    
    this.getCharsetName = function() {
        return "EUC-TW";
    }
    
    init();
}
jschardet.EUCTWProber.prototype = new jschardet.MultiByteCharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],16:[function(require,module,exports){
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
    
// GB2312 most frequently used character table
//
// Char to FreqOrder table , from hz6763

// 512  --> 0.79  -- 0.79
// 1024 --> 0.92  -- 0.13
// 2048 --> 0.98  -- 0.06
// 6768 --> 1.00  -- 0.02
//
// Ideal Distribution Ratio = 0.79135/(1-0.79135) = 3.79
// Random Distribution Ration = 512 / (3755 - 512) = 0.157
// 
// Typical Distribution Ratio about 25% of Ideal one, still much higher that RDR

jschardet.GB2312_TYPICAL_DISTRIBUTION_RATIO = 0.9;

jschardet.GB2312_TABLE_SIZE = 3760;

jschardet.GB2312CharToFreqOrder = [];

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],17:[function(require,module,exports){
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
    
jschardet.GB2312Prober = function() {
    jschardet.MultiByteCharSetProber.apply(this);
    
    var self = this;
    
    function init() {
        self._mCodingSM = new jschardet.CodingStateMachine(jschardet.GB2312SMModel);
        self._mDistributionAnalyzer = new jschardet.GB2312DistributionAnalysis();
        self.reset();
    }
    
    this.getCharsetName = function() {
        return "GB2312";
    }
    
    init();
}
jschardet.GB2312Prober.prototype = new jschardet.MultiByteCharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],18:[function(require,module,exports){
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
    
// This prober doesn't actually recognize a language or a charset.
// It is a helper prober for the use of the Hebrew model probers

////// General ideas of the Hebrew charset recognition //////
//
// Four main charsets exist in Hebrew:
// "ISO-8859-8" - Visual Hebrew
// "windows-1255" - Logical Hebrew 
// "ISO-8859-8-I" - Logical Hebrew
// "x-mac-hebrew" - ?? Logical Hebrew ??
//
// Both "ISO" charsets use a completely identical set of code points, whereas
// "windows-1255" and "x-mac-hebrew" are two different proper supersets of 
// these code points. windows-1255 defines additional characters in the range
// 0x80-0x9F as some misc punctuation marks as well as some Hebrew-specific 
// diacritics and additional 'Yiddish' ligature letters in the range 0xc0-0xd6.
// x-mac-hebrew defines similar additional code points but with a different 
// mapping.
//
// As far as an average Hebrew text with no diacritics is concerned, all four 
// charsets are identical with respect to code points. Meaning that for the 
// main Hebrew alphabet, all four map the same values to all 27 Hebrew letters 
// (including final letters).
//
// The dominant difference between these charsets is their directionality.
// "Visual" directionality means that the text is ordered as if the renderer is
// not aware of a BIDI rendering algorithm. The renderer sees the text and 
// draws it from left to right. The text itself when ordered naturally is read 
// backwards. A buffer of Visual Hebrew generally looks like so:
// "[last word of first line spelled backwards] [whole line ordered backwards
// and spelled backwards] [first word of first line spelled backwards] 
// [end of line] [last word of second line] ... etc' "
// adding punctuation marks, numbers and English text to visual text is
// naturally also "visual" and from left to right.
// 
// "Logical" directionality means the text is ordered "naturally" according to
// the order it is read. It is the responsibility of the renderer to display 
// the text from right to left. A BIDI algorithm is used to place general 
// punctuation marks, numbers and English text in the text.
//
// Texts in x-mac-hebrew are almost impossible to find on the Internet. From 
// what little evidence I could find, it seems that its general directionality
// is Logical.
//
// To sum up all of the above, the Hebrew probing mechanism knows about two
// charsets:
// Visual Hebrew - "ISO-8859-8" - backwards text - Words and sentences are
//    backwards while line order is natural. For charset recognition purposes
//    the line order is unimportant (In fact, for this implementation, even 
//    word order is unimportant).
// Logical Hebrew - "windows-1255" - normal, naturally ordered text.
//
// "ISO-8859-8-I" is a subset of windows-1255 and doesn't need to be 
//    specifically identified.
// "x-mac-hebrew" is also identified as windows-1255. A text in x-mac-hebrew
//    that contain special punctuation marks or diacritics is displayed with
//    some unconverted characters showing as question marks. This problem might
//    be corrected using another model prober for x-mac-hebrew. Due to the fact
//    that x-mac-hebrew texts are so rare, writing another model prober isn't 
//    worth the effort and performance hit.
//
//////// The Prober ////////
//
// The prober is divided between two SBCharSetProbers and a HebrewProber,
// all of which are managed, created, fed data, inquired and deleted by the
// SBCSGroupProber. The two SBCharSetProbers identify that the text is in
// fact some kind of Hebrew, Logical or Visual. The final decision about which
// one is it is made by the HebrewProber by combining final-letter scores
// with the scores of the two SBCharSetProbers to produce a final answer.
//
// The SBCSGroupProber is responsible for stripping the original text of HTML
// tags, English characters, numbers, low-ASCII punctuation characters, spaces
// and new lines. It reduces any sequence of such characters to a single space.
// The buffer fed to each prober in the SBCS group prober is pure text in
// high-ASCII.
// The two SBCharSetProbers (model probers) share the same language model:
// Win1255Model.
// The first SBCharSetProber uses the model normally as any other
// SBCharSetProber does, to recognize windows-1255, upon which this model was
// built. The second SBCharSetProber is told to make the pair-of-letter
// lookup in the language model backwards. This in practice exactly simulates
// a visual Hebrew model using the windows-1255 logical Hebrew model.
//
// The HebrewProber is not using any language model. All it does is look for
// final-letter evidence suggesting the text is either logical Hebrew or visual
// Hebrew. Disjointed from the model probers, the results of the HebrewProber
// alone are meaningless. HebrewProber always returns 0.00 as confidence
// since it never identifies a charset by itself. Instead, the pointer to the
// HebrewProber is passed to the model probers as a helper "Name Prober".
// When the Group prober receives a positive identification from any prober,
// it asks for the name of the charset identified. If the prober queried is a
// Hebrew model prober, the model prober forwards the call to the
// HebrewProber to make the final decision. In the HebrewProber, the
// decision is made according to the final-letters scores maintained and Both
// model probers scores. The answer is returned in the form of the name of the
// charset identified, either "windows-1255" or "ISO-8859-8".

jschardet.HebrewProber = function() {
    jschardet.CharSetProber.apply(this);
    
    // windows-1255 / ISO-8859-8 code points of interest
    var FINAL_KAF = '\xea'
    var NORMAL_KAF = '\xeb'
    var FINAL_MEM = '\xed'
    var NORMAL_MEM = '\xee'
    var FINAL_NUN = '\xef'
    var NORMAL_NUN = '\xf0'
    var FINAL_PE = '\xf3'
    var NORMAL_PE = '\xf4'
    var FINAL_TSADI = '\xf5'
    var NORMAL_TSADI = '\xf6'

    // Minimum Visual vs Logical final letter score difference.
    // If the difference is below this, don't rely solely on the final letter score distance.
    var MIN_FINAL_CHAR_DISTANCE = 5

    // Minimum Visual vs Logical model score difference.
    // If the difference is below this, don't rely at all on the model score distance.
    var MIN_MODEL_DISTANCE = 0.01

    var VISUAL_HEBREW_NAME = "ISO-8859-8"
    var LOGICAL_HEBREW_NAME = "windows-1255"
    var self = this;
    
    function init() {
        self._mLogicalProber = null;
        self._mVisualProber = null;
        self.reset();
    }
    
    this.reset = function() {
        this._mFinalCharLogicalScore = 0;
        this._mFinalCharVisualScore = 0;
        // The two last characters seen in the previous buffer,
        // mPrev and mBeforePrev are initialized to space in order to simulate a word 
        // delimiter at the beginning of the data
        this._mPrev = " ";
        this._mBeforePrev = " ";
        // These probers are owned by the group prober.
    }
    
    this.setModelProbers = function(logicalProber, visualProber) {
        this._mLogicalProber = logicalProber;
        this._mVisualProber = visualProber;
    }
    
    this.isFinal = function(c) {
        return [FINAL_KAF, FINAL_MEM, FINAL_NUN, FINAL_PE, FINAL_TSADI].indexOf(c) != -1;
    }
    
    this.isNonFinal = function(c) {
        // The normal Tsadi is not a good Non-Final letter due to words like 
        // 'lechotet' (to chat) containing an apostrophe after the tsadi. This 
        // apostrophe is converted to a space in FilterWithoutEnglishLetters causing 
        // the Non-Final tsadi to appear at an end of a word even though this is not 
        // the case in the original text.
        // The letters Pe and Kaf rarely display a related behavior of not being a 
        // good Non-Final letter. Words like 'Pop', 'Winamp' and 'Mubarak' for 
        // example legally end with a Non-Final Pe or Kaf. However, the benefit of 
        // these letters as Non-Final letters outweighs the damage since these words 
        // are quite rare.
        return [NORMAL_KAF, NORMAL_MEM, NORMAL_NUN, NORMAL_PE].indexOf(c) != -1;
    }
    
    this.feed = function(aBuf) {
        // Final letter analysis for logical-visual decision.
        // Look for evidence that the received buffer is either logical Hebrew or 
        // visual Hebrew.
        // The following cases are checked:
        // 1) A word longer than 1 letter, ending with a final letter. This is an 
        //    indication that the text is laid out "naturally" since the final letter 
        //    really appears at the end. +1 for logical score.
        // 2) A word longer than 1 letter, ending with a Non-Final letter. In normal
        //    Hebrew, words ending with Kaf, Mem, Nun, Pe or Tsadi, should not end with
        //    the Non-Final form of that letter. Exceptions to this rule are mentioned
        //    above in isNonFinal(). This is an indication that the text is laid out
        //    backwards. +1 for visual score
        // 3) A word longer than 1 letter, starting with a final letter. Final letters 
        //    should not appear at the beginning of a word. This is an indication that 
        //    the text is laid out backwards. +1 for visual score.
        // 
        // The visual score and logical score are accumulated throughout the text and 
        // are finally checked against each other in GetCharSetName().
        // No checking for final letters in the middle of words is done since that case
        // is not an indication for either Logical or Visual text.
        // 
        // We automatically filter out all 7-bit characters (replace them with spaces)
        // so the word boundary detection works properly. [MAP]
        
        if( this.getState() == jschardet.Constants.notMe ) {
            // Both model probers say it's not them. No reason to continue.
            return jschardet.Constants.notMe;
        }
        
        aBuf = this.filterHighBitOnly(aBuf);
        
        for( var i = 0, cur; i < aBuf.length; i++ ) {
            cur = aBuf[i];
            if( cur == " " ) {
                // We stand on a space - a word just ended
                if( this._mBeforePrev != " " ) {
                    // next-to-last char was not a space so self._mPrev is not a 1 letter word
                    if( this.isFinal(this._mPrev) ) {
                        // case (1) [-2:not space][-1:final letter][cur:space]
                        this._mFinalCharLogicalScore++;
                    } else if( this.isNonFinal(this._mPrev) ) {
                        // case (2) [-2:not space][-1:Non-Final letter][cur:space]
                        this._mFinalCharVisualScore++;
                    }
                }
            } else {
                // Not standing on a space
                if( this._mBeforePrev == " " && this.isFinal(this._mPrev) && cur != " " ) {
                    // case (3) [-2:space][-1:final letter][cur:not space]
                    this._mFinalCharVisualScore++;
                }
            }
            this._mBeforePrev = this._mPrev;
            this._mPrev = cur;
        }
        // Forever detecting, till the end or until both model probers return eNotMe (handled above)
        return jschardet.Constants.detecting;
    }
    
    this.getCharsetName = function() {
        // Make the decision: is it Logical or Visual?
        // If the final letter score distance is dominant enough, rely on it.
        var finalsub = this._mFinalCharLogicalScore - this._mFinalCharVisualScore;
        if( finalsub >= MIN_FINAL_CHAR_DISTANCE ) {
            return LOGICAL_HEBREW_NAME;
        }
        if( finalsub <= -MIN_FINAL_CHAR_DISTANCE ) {
            return VISUAL_HEBREW_NAME;
        }
        
        // It's not dominant enough, try to rely on the model scores instead.
        var modelsub = this._mLogicalProber.getConfidence() - this._mVisualProber.getConfidence();
        if( modelsub > MIN_MODEL_DISTANCE ) {
            return LOGICAL_HEBREW_NAME;
        }
        if( modelsub < -MIN_MODEL_DISTANCE ) {
            return VISUAL_HEBREW_NAME;
        }
        
        // Still no good, back to final letter distance, maybe it'll save the day.
        if( finalsub < 0 ) {
            return VISUAL_HEBREW_NAME;
        }
        
        // (finalsub > 0 - Logical) or (don't know what to do) default to Logical.
        return LOGICAL_HEBREW_NAME;
    }
    
    this.getState = function() {
        // Remain active as long as any of the model probers are active.
        if( this._mLogicalProber.getState() == jschardet.Constants.notMe &&
            this._mVisualProber.getState() == jschardet.Constants.notMe ) {
            return jschardet.Constants.notMe;
        }
        return jschardet.Constants.detecting;
    }
    
    init();
}
jschardet.HebrewProber.prototype = new jschardet.CharSetProber();
   
// https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Objects/Array/IndexOf
if (!Array.prototype.indexOf)
{
    Array.prototype.indexOf = function(elt /*, from*/)
    {
        var len = this.length >>> 0;

        var from = Number(arguments[1]) || 0;
        from = (from < 0)
             ? Math.ceil(from)
             : Math.floor(from);
        if (from < 0)
            from += len;

        for (; from < len; from++)
        {
            if (from in this &&
                this[from] === elt)
                return from;
        }
        return -1;
    };
}

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],19:[function(require,module,exports){
module.exports = require('./init')
},{"./init":20}],20:[function(require,module,exports){
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
    require('./escsm');
    require('./mbcssm');
    require('./charsetprober');
    require('./mbcharsetprober');
    //require('./jisfreq');
    //require('./gb2312freq');
    //require('./euckrfreq');
    //require('./big5freq');
    //require('./euctwfreq');
    require('./chardistribution');
    //require('./jpcntx');
    //require('./sjisprober');
    require('./utf8prober');
    require('./charsetgroupprober');
    //require('./eucjpprober');
    //require('./gb2312prober');
    //require('./euckrprober');
    //require('./big5prober');
    //require('./euctwprober');
    require('./mbcsgroupprober');
    //require('./sbcharsetprober');
    //require('./langgreekmodel');
    //require('./langthaimodel');
    //require('./langbulgarianmodel');
    //require('./langcyrillicmodel');
    //require('./hebrewprober');
    //require('./langhebrewmodel');
    //require('./langhungarianmodel');
    //require('./sbcsgroupprober');
    require('./latin1prober');
    require('./escprober');
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
},{"./big5freq":2,"./big5prober":3,"./chardistribution":4,"./charsetgroupprober":5,"./charsetprober":6,"./codingstatemachine":7,"./constants":8,"./escprober":9,"./escsm":10,"./eucjpprober":11,"./euckrfreq":12,"./euckrprober":13,"./euctwfreq":14,"./euctwprober":15,"./gb2312freq":16,"./gb2312prober":17,"./hebrewprober":18,"./jisfreq":21,"./jpcntx":22,"./langbulgarianmodel":23,"./langcyrillicmodel":24,"./langgreekmodel":25,"./langhebrewmodel":26,"./langhungarianmodel":27,"./langthaimodel":28,"./latin1prober":29,"./mbcharsetprober":30,"./mbcsgroupprober":31,"./mbcssm":32,"./sbcharsetprober":33,"./sbcsgroupprober":34,"./sjisprober":35,"./universaldetector":36,"./utf8prober":37,"_process":41,"buffer":38}],21:[function(require,module,exports){
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
    
// Sampling from about 20M text materials include literature and computer technology
//
// Japanese frequency table, applied to both S-JIS and EUC-JP
// They are sorted in order. 
//
// 128  --> 0.77094
// 256  --> 0.85710
// 512  --> 0.92635
// 1024 --> 0.97130
// 2048 --> 0.99431
//
// Ideal Distribution Ratio = 0.92635 / (1-0.92635) = 12.58
// Random Distribution Ration = 512 / (2965+62+83+86-512) = 0.191
// 
// Typical Distribution Ratio, 25% of IDR 


jschardet.JIS_TYPICAL_DISTRIBUTION_RATIO = 3.0;

jschardet.JIS_TABLE_SIZE = 4368;

jschardet.JISCharToFreqOrder = [];

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],22:[function(require,module,exports){
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
    
// This is hiragana 2-char sequence table, the number in each cell represents its frequency category
jschardet.jp2CharContext = [];

jschardet.JapaneseContextAnalysis = function() {
    var NUM_OF_CATEGORY = 6;
    var DONT_KNOW = -1;
    var ENOUGH_REL_THRESHOLD = 100;
    var MAX_REL_THRESHOLD = 1000;
    var MINIMUM_DATA_THRESHOLD = 4;
    var self = this;
    
    function init() {
        self.reset();
    }
    
    this.reset = function() {
        this._mTotalRel = 0; // total sequence received
        this._mRelSample = []; // category counters, each interger counts sequence in its category
        for( var i = 0; i < NUM_OF_CATEGORY; this._mRelSample[i++] = 0 );
        this._mNeedToSkipCharNum = 0; // if last byte in current buffer is not the last byte of a character, we need to know how many bytes to skip in next buffer
        this._mLastCharOrder = -1; // The order of previous char
        this._mDone = false; // If this flag is set to true, detection is done and conclusion has been made
    }
    
    this.feed = function(aBuf, aLen) {
        if( this._mDone ) return;
        
        // The buffer we got is byte oriented, and a character may span in more than one
        // buffers. In case the last one or two byte in last buffer is not complete, we 
        // record how many byte needed to complete that character and skip these bytes here.
        // We can choose to record those bytes as well and analyse the character once it 
        // is complete, but since a character will not make much difference, by simply skipping
        // this character will simply our logic and improve performance.
        var i = this._mNeedToSkipCharNum;
        while( i < aLen ) {
            var rets = this.getOrder(aBuf.slice(i,i+2));
            var order = rets[0];
            var charLen = rets[1];
            i += charLen;
            if( i > aLen ) {
                this._mNeedToSkipCharNum = i - aLen;
                this._mLastCharOrder = -1;
            } else {
                if( order != -1 && this._mLastCharOrder != -1 ) {
                    this._mTotalRel += 1;
                    if( this._mTotalRel > MAX_REL_THRESHOLD ) {
                        this._mDone = true;
                        break;
                    }
                    this._mRelSample[jschardet.jp2CharContext[this._mLastCharOrder][order]] += 1;
                }
                this._mLastCharOrder = order;
            }
        }
    }
    
    this.gotEnoughData = function() {
        return this._mTotalRel > ENOUGH_REL_THRESHOLD;
    }
    
    this.getConfidence = function() {
        // This is just one way to calculate confidence. It works well for me.
        if( this._mTotalRel > MINIMUM_DATA_THRESHOLD ) {
            return (this._mTotalRel - this._mRelSample[0]) / this._mTotalRel;
        } else {
            return DONT_KNOW;
        }
    }
    
    this.getOrder = function(aStr) {
        return [-1, 1];
    }
    
    init();
}
        
jschardet.SJISContextAnalysis = function() {
    this.getOrder = function(aStr) {
        if( !aStr ) return [-1, 1];
        // find out current char's byte length
        if( (aStr.charCodeAt(0) >= 0x81 && aStr.charCodeAt(0) <= 0x9F) ||
            (aStr.charCodeAt(0) >= 0xE0 && aStr.charCodeAt(0) <= 0xFC) ) {
            var charLen = 2;
        } else {
            charLen = 1;
        }
        
        // return its order if it is hiragana
        if( aStr.length > 1 ) {
            if( aStr.charCodeAt(0) == 0x82 && aStr.charCodeAt(1) >= 0x9F &&
                aStr.charCodeAt(0) <= 0xF1 ) {
                return [aStr.charCodeAt(1) - 0x9F, charLen];
            }
        }
        
        return [-1, charLen];
    }
}
jschardet.SJISContextAnalysis.prototype = new jschardet.JapaneseContextAnalysis();

jschardet.EUCJPContextAnalysis = function() {
    this.getOrder = function(aStr) {
        if( !aStr ) return [-1, 1];
        // find out current char's byte length
        if( aStr.charCodeAt(0) >= 0x8E ||
            (aStr.charCodeAt(0) >= 0xA1 && aStr.charCodeAt(0) <= 0xFE) ) {
            var charLen = 2;
        } else if( aStr.charCodeAt(0) == 0x8F ) {
            charLen = 3;
        } else {
            charLen = 1;
        }
        
        // return its order if it is hiragana
        if( aStr.length > 1 ) {
            if( aStr.charCodeAt(0) == 0xA4 && aStr.charCodeAt(1) >= 0xA1 &&
                aStr.charCodeAt(1) <= 0xF3 ) {
                return [aStr.charCodeAt(1) - 0xA1, charLen];
            }
        }
        
        return [-1, charLen];
    }
}
jschardet.EUCJPContextAnalysis.prototype = new jschardet.JapaneseContextAnalysis();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],23:[function(require,module,exports){
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
    
// 255: Control characters that usually does not exist in any text
// 254: Carriage/Return
// 253: symbol (punctuation) that does not belong to word
// 252: 0 - 9

// Character Mapping Table:
// this table is modified base on win1251BulgarianCharToOrderMap, so 
// only number <64 is sure valid

jschardet.Latin5_BulgarianCharToOrderMap = [];

jschardet.win1251BulgarianCharToOrderMap = [];

// Model Table: 
// total sequences: 100%
// first 512 sequences: 96.9392%
// first 1024 sequences:3.0618%
// rest  sequences:     0.2992%
// negative sequences:  0.0020% 
jschardet.BulgarianLangModel = [];

jschardet.Latin5BulgarianModel = {
    "charToOrderMap"        : jschardet.Latin5_BulgarianCharToOrderMap,
    "precedenceMatrix"      : jschardet.BulgarianLangModel,
    "mTypicalPositiveRatio" : 0.969392,
    "keepEnglishLetter"     : false,
    "charsetName"           : "ISO-8859-5"
};

jschardet.Win1251BulgarianModel = {
    "charToOrderMap"        : jschardet.win1251BulgarianCharToOrderMap,
    "precedenceMatrix"      : jschardet.BulgarianLangModel,
    "mTypicalPositiveRatio" : 0.969392,
    "keepEnglishLetter"     : false,
    "charsetName"           : "windows-1251"
};

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],24:[function(require,module,exports){
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
    
// KOI8-R language model
// Character Mapping Table:
jschardet.KOI8R_CharToOrderMap = [];

jschardet.win1251_CharToOrderMap = [
255,255,255,255,255,255,255,255,255,255,254,255,255,254,255,255,  // 00
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,  // 10
253,253,253,253,253,253,253,253,253,253,253,253,253,253,253,253,  // 20
252,252,252,252,252,252,252,252,252,252,253,253,253,253,253,253,  // 30
253,142,143,144,145,146,147,148,149,150,151,152, 74,153, 75,154,  // 40
155,156,157,158,159,160,161,162,163,164,165,253,253,253,253,253,  // 50
253, 71,172, 66,173, 65,174, 76,175, 64,176,177, 77, 72,178, 69,  // 60
 67,179, 78, 73,180,181, 79,182,183,184,185,253,253,253,253,253,  // 70
191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,
207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,
223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,
239,240,241,242,243,244,245,246, 68,247,248,249,250,251,252,253,
 37, 44, 33, 46, 41, 48, 56, 51, 42, 60, 36, 49, 38, 31, 34, 35,
 45, 32, 40, 52, 53, 55, 58, 50, 57, 63, 70, 62, 61, 47, 59, 43,
  3, 21, 10, 19, 13,  2, 24, 20,  4, 23, 11,  8, 12,  5,  1, 15,
  9,  7,  6, 14, 39, 26, 28, 22, 25, 29, 54, 18, 17, 30, 27, 16
];

jschardet.latin5_CharToOrderMap = [];

jschardet.macCyrillic_CharToOrderMap = [];

jschardet.IBM855_CharToOrderMap = [];

jschardet.IBM866_CharToOrderMap = [];

// Model Table: 
// total sequences: 100%
// first 512 sequences: 97.6601%
// first 1024 sequences: 2.3389%
// rest  sequences:      0.1237%
// negative sequences:   0.0009% 
jschardet.RussianLangModel = [];

jschardet.Koi8rModel = {
    "charToOrderMap"          : jschardet.KOI8R_CharToOrderMap,
    "precedenceMatrix"        : jschardet.RussianLangModel,
    "mTypicalPositiveRatio"   : 0.976601,
    "keepEnglishLetter"       : false,
    "charsetName"             : "KOI8-R"
};

jschardet.Win1251CyrillicModel = {
    "charToOrderMap"          : jschardet.win1251_CharToOrderMap,
    "precedenceMatrix"        : jschardet.RussianLangModel,
    "mTypicalPositiveRatio"   : 0.976601,
    "keepEnglishLetter"       : false,
    "charsetName"             : "windows-1251"
};

jschardet.Latin5CyrillicModel = {
    "charToOrderMap"          : jschardet.latin5_CharToOrderMap,
    "precedenceMatrix"        : jschardet.RussianLangModel,
    "mTypicalPositiveRatio"   : 0.976601,
    "keepEnglishLetter"       : false,
    "charsetName"             : "ISO-8859-5"
};

jschardet.MacCyrillicModel = {
    "charToOrderMap"          : jschardet.macCyrillic_CharToOrderMap,
    "precedenceMatrix"        : jschardet.RussianLangModel,
    "mTypicalPositiveRatio"   : 0.976601,
    "keepEnglishLetter"       : false,
    "charsetName"             : "MacCyrillic"
};

jschardet.Ibm866Model = {
    "charToOrderMap"          : jschardet.IBM866_CharToOrderMap,
    "precedenceMatrix"        : jschardet.RussianLangModel,
    "mTypicalPositiveRatio"   : 0.976601,
    "keepEnglishLetter"       : false,
    "charsetName"             : "IBM866"
};

jschardet.Ibm855Model = {
    "charToOrderMap"          : jschardet.IBM855_CharToOrderMap,
    "precedenceMatrix"        : jschardet.RussianLangModel,
    "mTypicalPositiveRatio"   : 0.976601,
    "keepEnglishLetter"       : false,
    "charsetName"             : "IBM855"
};

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],25:[function(require,module,exports){
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
    
// 255: Control characters that usually does not exist in any text
// 254: Carriage/Return
// 253: symbol (punctuation) that does not belong to word
// 252: 0 - 9

// Character Mapping Table:
jschardet.Latin7_CharToOrderMap = [
255,255,255,255,255,255,255,255,255,255,254,255,255,254,255,255,  // 00
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,  // 10
253,253,253,253,253,253,253,253,253,253,253,253,253,253,253,253,  // 20
252,252,252,252,252,252,252,252,252,252,253,253,253,253,253,253,  // 30
253, 82,100,104, 94, 98,101,116,102,111,187,117, 92, 88,113, 85,  // 40
 79,118,105, 83, 67,114,119, 95, 99,109,188,253,253,253,253,253,  // 50
253, 72, 70, 80, 81, 60, 96, 93, 89, 68,120, 97, 77, 86, 69, 55,  // 60
 78,115, 65, 66, 58, 76,106,103, 87,107,112,253,253,253,253,253,  // 70
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,  // 80
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,  // 90
253,233, 90,253,253,253,253,253,253,253,253,253,253, 74,253,253,  // a0
253,253,253,253,247,248, 61, 36, 46, 71, 73,253, 54,253,108,123,  // b0
110, 31, 51, 43, 41, 34, 91, 40, 52, 47, 44, 53, 38, 49, 59, 39,  // c0
 35, 48,250, 37, 33, 45, 56, 50, 84, 57,120,121, 17, 18, 22, 15,  // d0
124,  1, 29, 20, 21,  3, 32, 13, 25,  5, 11, 16, 10,  6, 30,  4,  // e0
  9,  8, 14,  7,  2, 12, 28, 23, 42, 24, 64, 75, 19, 26, 27,253   // f0
];

jschardet.win1253_CharToOrderMap = [
255,255,255,255,255,255,255,255,255,255,254,255,255,254,255,255,  // 00
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,  // 10
253,253,253,253,253,253,253,253,253,253,253,253,253,253,253,253,  // 20
252,252,252,252,252,252,252,252,252,252,253,253,253,253,253,253,  // 30
253, 82,100,104, 94, 98,101,116,102,111,187,117, 92, 88,113, 85,  // 40
 79,118,105, 83, 67,114,119, 95, 99,109,188,253,253,253,253,253,  // 50
253, 72, 70, 80, 81, 60, 96, 93, 89, 68,120, 97, 77, 86, 69, 55,  // 60
 78,115, 65, 66, 58, 76,106,103, 87,107,112,253,253,253,253,253,  // 70
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,  // 80
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,  // 90
253,233, 61,253,253,253,253,253,253,253,253,253,253, 74,253,253,  // a0
253,253,253,253,247,253,253, 36, 46, 71, 73,253, 54,253,108,123,  // b0
110, 31, 51, 43, 41, 34, 91, 40, 52, 47, 44, 53, 38, 49, 59, 39,  // c0
 35, 48,250, 37, 33, 45, 56, 50, 84, 57,120,121, 17, 18, 22, 15,  // d0
124,  1, 29, 20, 21,  3, 32, 13, 25,  5, 11, 16, 10,  6, 30,  4,  // e0
  9,  8, 14,  7,  2, 12, 28, 23, 42, 24, 64, 75, 19, 26, 27,253   // f0
]

// Model Table: 
// total sequences: 100%
// first 512 sequences: 98.2851%
// first 1024 sequences:1.7001%
// rest  sequences:     0.0359%
// negative sequences:  0.0148% 
jschardet.GreekLangModel = [
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,3,2,2,3,3,3,3,3,3,3,3,1,3,3,3,0,2,2,3,3,0,3,0,3,2,0,3,3,3,0,
3,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,3,0,3,3,0,3,2,3,3,0,3,2,3,3,3,0,0,3,0,3,0,3,3,2,0,0,0,
2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,
0,2,3,2,2,3,3,3,3,3,3,3,3,0,3,3,3,3,0,2,3,3,0,3,3,3,3,2,3,3,3,0,
2,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,2,3,3,2,3,3,3,3,3,3,3,3,3,3,3,3,0,2,1,3,3,3,3,2,3,3,2,3,3,2,0,
0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,0,3,3,3,3,3,3,0,3,3,0,3,3,3,3,3,3,3,3,3,3,0,3,2,3,3,0,
2,0,1,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,
0,3,3,3,3,3,2,3,0,0,0,0,3,3,0,3,1,3,3,3,0,3,3,0,3,3,3,3,0,0,0,0,
2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,3,0,3,0,3,3,3,3,3,0,3,2,2,2,3,0,2,3,3,3,3,3,2,3,3,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,3,3,2,2,2,3,3,3,3,0,3,1,3,3,3,3,2,3,3,3,3,3,3,3,2,2,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,3,2,0,3,0,0,0,3,3,2,3,3,3,3,3,0,0,3,2,3,0,2,3,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,0,3,3,3,3,0,0,3,3,0,2,3,0,3,0,3,3,3,0,0,3,0,3,0,2,2,3,3,0,0,
0,0,1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,3,2,0,3,2,3,3,3,3,0,3,3,3,3,3,0,3,3,2,3,2,3,3,2,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,2,3,2,3,3,3,3,3,3,0,2,3,2,3,2,2,2,3,2,3,3,2,3,0,2,2,2,3,0,
2,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,3,0,0,0,3,3,3,2,3,3,0,0,3,0,3,0,0,0,3,2,0,3,0,3,0,0,2,0,2,0,
0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,0,3,3,3,3,3,3,0,3,3,0,3,0,0,0,3,3,0,3,3,3,0,0,1,2,3,0,
3,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,3,2,0,0,3,2,2,3,3,0,3,3,3,3,3,2,1,3,0,3,2,3,3,2,1,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,3,3,0,2,3,3,3,3,3,3,0,0,3,0,3,0,0,0,3,3,0,3,2,3,0,0,3,3,3,0,
3,0,0,0,2,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,0,3,3,3,3,3,3,0,0,3,0,3,0,0,0,3,2,0,3,2,3,0,0,3,2,3,0,
2,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,3,1,2,2,3,3,3,3,3,3,0,2,3,0,3,0,0,0,3,3,0,3,0,2,0,0,2,3,1,0,
2,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,0,3,3,3,3,0,3,0,3,3,2,3,0,3,3,3,3,3,3,0,3,3,3,0,2,3,0,0,3,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,0,3,3,3,0,0,3,0,0,0,3,3,0,3,0,2,3,3,0,0,3,0,3,0,3,3,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,3,0,0,0,3,3,3,3,3,3,0,0,3,0,2,0,0,0,3,3,0,3,0,3,0,0,2,0,2,0,
0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,3,3,0,3,0,2,0,3,2,0,3,2,3,2,3,0,0,3,2,3,2,3,3,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,3,0,0,2,3,3,3,3,3,0,0,0,3,0,2,1,0,0,3,2,2,2,0,3,0,0,2,2,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,0,3,3,3,2,0,3,0,3,0,3,3,0,2,1,2,3,3,0,0,3,0,3,0,3,3,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,2,3,3,3,0,3,3,3,3,3,3,0,2,3,0,3,0,0,0,2,1,0,2,2,3,0,0,2,2,2,0,
0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,3,0,0,2,3,3,3,2,3,0,0,1,3,0,2,0,0,0,0,3,0,1,0,2,0,0,1,1,1,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,3,1,0,3,0,0,0,3,2,0,3,2,3,3,3,0,0,3,0,3,2,2,2,1,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,0,3,3,3,0,0,3,0,0,0,0,2,0,2,3,3,2,2,2,2,3,0,2,0,2,2,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,3,3,3,2,0,0,0,0,0,0,2,3,0,2,0,2,3,2,0,0,3,0,3,0,3,1,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,3,2,3,3,2,2,3,0,2,0,3,0,0,0,2,0,0,0,0,1,2,0,2,0,2,0,
0,2,0,2,0,2,2,0,0,1,0,2,2,2,0,2,2,2,0,2,2,2,0,0,2,0,0,1,0,0,0,0,
0,2,0,3,3,2,0,0,0,0,0,0,1,3,0,2,0,2,2,2,0,0,2,0,3,0,0,2,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,0,2,3,2,0,2,2,0,2,0,2,2,0,2,0,2,2,2,0,0,0,0,0,0,2,3,0,0,0,2,
0,1,2,0,0,0,0,2,2,0,0,0,2,1,0,2,2,0,0,0,0,0,0,1,0,2,0,0,0,0,0,0,
0,0,2,1,0,2,3,2,2,3,2,3,2,0,0,3,3,3,0,0,3,2,0,0,0,1,1,0,2,0,2,2,
0,2,0,2,0,2,2,0,0,2,0,2,2,2,0,2,2,2,2,0,0,2,0,0,0,2,0,1,0,0,0,0,
0,3,0,3,3,2,2,0,3,0,0,0,2,2,0,2,2,2,1,2,0,0,1,2,2,0,0,3,0,0,0,2,
0,1,2,0,0,0,1,2,0,0,0,0,0,0,0,2,2,0,1,0,0,2,0,0,0,2,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,2,3,3,2,2,0,0,0,2,0,2,3,3,0,2,0,0,0,0,0,0,2,2,2,0,2,2,0,2,0,2,
0,2,2,0,0,2,2,2,2,1,0,0,2,2,0,2,0,0,2,0,0,0,0,0,0,2,0,0,0,0,0,0,
0,2,0,3,2,3,0,0,0,3,0,0,2,2,0,2,0,2,2,2,0,0,2,0,0,0,0,0,0,0,0,2,
0,0,2,2,0,0,2,2,2,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,2,0,0,3,2,0,2,2,2,2,2,0,0,0,2,0,0,0,0,2,0,1,0,0,2,0,1,0,0,0,
0,2,2,2,0,2,2,0,1,2,0,2,2,2,0,2,2,2,2,1,2,2,0,0,2,0,0,0,0,0,0,0,
0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,
0,2,0,2,0,2,2,0,0,0,0,1,2,1,0,0,2,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,3,2,3,0,0,2,0,0,0,2,2,0,2,0,0,0,1,0,0,2,0,2,0,2,2,0,0,0,0,
0,0,2,0,0,0,0,2,2,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,
0,2,2,3,2,2,0,0,0,0,0,0,1,3,0,2,0,2,2,0,0,0,1,0,2,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,2,0,2,0,3,2,0,2,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
0,0,2,0,0,0,0,1,1,0,0,2,1,2,0,2,2,0,1,0,0,1,0,0,0,2,0,0,0,0,0,0,
0,3,0,2,2,2,0,0,2,0,0,0,2,0,0,0,2,3,0,2,0,0,0,0,0,0,2,2,0,0,0,2,
0,1,2,0,0,0,1,2,2,1,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,2,1,2,0,2,2,0,2,0,0,2,0,0,0,0,1,2,1,0,2,1,0,0,0,0,0,0,0,0,0,0,
0,0,2,0,0,0,3,1,2,2,0,2,0,0,0,0,2,0,0,0,2,0,0,3,0,0,0,0,2,2,2,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,2,1,0,2,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1,0,0,0,0,0,0,2,
0,2,2,0,0,2,2,2,2,2,0,1,2,0,0,0,2,2,0,1,0,2,0,0,2,2,0,0,0,0,0,0,
0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,2,0,0,0,0,0,0,0,0,2,0,2,0,0,0,0,2,
0,1,2,0,0,0,0,2,2,1,0,1,0,1,0,2,2,2,1,0,0,0,0,0,0,1,0,0,0,0,0,0,
0,2,0,1,2,0,0,0,0,0,0,0,0,0,0,2,0,0,2,2,0,0,0,0,1,0,0,0,0,0,0,2,
0,2,2,0,0,0,0,2,2,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,
0,2,2,2,2,0,0,0,3,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0,0,0,1,
0,0,2,0,0,0,0,1,2,0,0,0,0,0,0,2,2,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,
0,2,0,2,2,2,0,0,2,0,0,0,0,0,0,0,2,2,2,0,0,0,2,0,0,0,0,0,0,0,0,2,
0,0,1,0,0,0,0,2,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,
0,3,0,2,0,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,0,2,
0,0,2,0,0,0,0,2,2,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,2,0,2,2,1,0,0,0,0,0,0,2,0,0,2,0,2,2,2,0,0,0,0,0,0,2,0,0,0,0,2,
0,0,2,0,0,2,0,2,2,0,0,0,0,2,0,2,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,
0,0,3,0,0,0,2,2,0,2,2,0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,
0,2,2,2,2,2,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,
0,0,0,0,0,0,0,2,1,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,2,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,
0,2,0,0,0,2,0,0,0,0,0,1,0,0,0,0,2,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,2,0,0,0,
0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,2,0,2,0,0,0,
0,0,0,0,0,0,0,0,2,1,0,0,0,0,0,0,2,0,0,0,1,2,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
];

jschardet.Latin7GreekModel = {
    "charToOrderMap"        : jschardet.Latin7_CharToOrderMap,
    "precedenceMatrix"      : jschardet.GreekLangModel,
    "mTypicalPositiveRatio" : 0.982851,
    "keepEnglishLetter"     : false,
    "charsetName"           : "ISO-8859-7"
};

jschardet.Win1253GreekModel = {
    "charToOrderMap"        : jschardet.win1253_CharToOrderMap,
    "precedenceMatrix"      : jschardet.GreekLangModel,
    "mTypicalPositiveRatio" : 0.982851,
    "keepEnglishLetter"     : false,
    "charsetName"           : "windows-1253"
};

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],26:[function(require,module,exports){
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
    
// 255: Control characters that usually does not exist in any text
// 254: Carriage/Return
// 253: symbol (punctuation) that does not belong to word
// 252: 0 - 9

// Windows-1255 language model
// Character Mapping Table:
jschardet.win1255_CharToOrderMap = [
255,255,255,255,255,255,255,255,255,255,254,255,255,254,255,255,  // 00
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,  // 10
253,253,253,253,253,253,253,253,253,253,253,253,253,253,253,253,  // 20
252,252,252,252,252,252,252,252,252,252,253,253,253,253,253,253,  // 30
253, 69, 91, 79, 80, 92, 89, 97, 90, 68,111,112, 82, 73, 95, 85,  // 40
 78,121, 86, 71, 67,102,107, 84,114,103,115,253,253,253,253,253,  // 50
253, 50, 74, 60, 61, 42, 76, 70, 64, 53,105, 93, 56, 65, 54, 49,  // 60
 66,110, 51, 43, 44, 63, 81, 77, 98, 75,108,253,253,253,253,253,  // 70
124,202,203,204,205, 40, 58,206,207,208,209,210,211,212,213,214,
215, 83, 52, 47, 46, 72, 32, 94,216,113,217,109,218,219,220,221,
 34,116,222,118,100,223,224,117,119,104,125,225,226, 87, 99,227,
106,122,123,228, 55,229,230,101,231,232,120,233, 48, 39, 57,234,
 30, 59, 41, 88, 33, 37, 36, 31, 29, 35,235, 62, 28,236,126,237,
238, 38, 45,239,240,241,242,243,127,244,245,246,247,248,249,250,
  9,  8, 20, 16,  3,  2, 24, 14, 22,  1, 25, 15,  4, 11,  6, 23,
 12, 19, 13, 26, 18, 27, 21, 17,  7, 10,  5,251,252,128, 96,253
];

// Model Table: 
// total sequences: 100%
// first 512 sequences: 98.4004%
// first 1024 sequences: 1.5981%
// rest  sequences:      0.087%
// negative sequences:   0.0015% 
jschardet.HebrewLangModel = [
0,3,3,3,3,3,3,3,3,3,3,2,3,3,3,3,3,3,3,3,3,3,3,2,3,2,1,2,0,1,0,0,
3,0,3,1,0,0,1,3,2,0,1,1,2,0,2,2,2,1,1,1,1,2,1,1,1,2,0,0,2,2,0,1,
3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,
1,2,1,2,1,2,0,0,2,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,
1,2,1,3,1,1,0,0,2,0,0,0,1,0,1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,
3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1,0,1,2,2,1,3,
1,2,1,1,2,2,0,0,2,2,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,1,0,1,1,0,
3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,3,3,2,2,2,2,3,2,
1,2,1,2,2,2,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,3,3,2,3,2,2,3,2,2,2,1,2,2,2,2,
1,2,1,1,2,2,0,1,2,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,0,2,2,2,2,2,
0,2,0,2,2,2,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,3,0,2,2,2,
0,2,1,2,2,2,0,0,2,1,0,0,0,0,1,0,1,0,0,0,0,0,0,2,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,3,3,3,3,3,2,3,3,3,3,3,3,3,3,3,3,3,3,3,2,1,2,3,2,2,2,
1,2,1,2,2,2,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,1,0,
3,3,3,3,3,3,3,3,3,2,3,3,3,2,3,3,3,3,3,3,3,3,3,3,3,3,3,1,0,2,0,2,
0,2,1,2,2,2,0,0,1,2,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,1,0,
3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,3,2,3,2,2,3,2,1,2,1,1,1,
0,1,1,1,1,1,3,0,1,0,0,0,0,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,
3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,0,1,0,0,1,0,0,0,0,
0,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,
0,2,0,1,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,3,3,3,2,3,3,3,2,1,2,3,3,2,3,3,3,3,2,3,2,1,2,0,2,1,2,
0,2,0,2,2,2,0,0,1,2,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,
3,3,3,3,3,3,3,3,3,2,3,3,3,1,2,2,3,3,2,3,2,3,2,2,3,1,2,2,0,2,2,2,
0,2,1,2,2,2,0,0,1,2,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,
3,3,3,3,3,3,3,3,3,3,3,3,3,2,3,3,3,2,3,3,2,2,2,3,3,3,3,1,3,2,2,2,
0,2,0,1,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,3,3,3,2,3,2,2,2,1,2,2,0,2,2,2,2,
0,2,0,2,2,2,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,3,3,3,3,3,2,3,3,3,1,3,2,3,3,2,3,3,2,2,1,2,2,2,2,2,2,
0,2,1,2,1,2,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,2,3,2,3,3,2,3,3,3,3,2,3,2,3,3,3,3,3,2,2,2,2,2,2,2,1,
0,2,0,1,2,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,3,3,3,2,1,2,3,3,3,3,3,3,3,2,3,2,3,2,1,2,3,0,2,1,2,2,
0,2,1,1,2,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,2,0,
3,3,3,3,3,3,3,3,3,2,3,3,3,3,2,1,3,1,2,2,2,1,2,3,3,1,2,1,2,2,2,2,
0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,
3,3,3,3,3,3,3,3,3,3,0,2,3,3,3,1,3,3,3,1,2,2,2,2,1,1,2,2,2,2,2,2,
0,2,0,1,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,
3,3,3,3,3,3,2,3,3,3,2,2,3,3,3,2,1,2,3,2,3,2,2,2,2,1,2,1,1,1,2,2,
0,2,1,1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,
3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,1,0,0,0,0,0,
1,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
3,3,3,3,3,2,3,3,2,3,1,2,2,2,2,3,2,3,1,1,2,2,1,2,2,1,1,0,2,2,2,2,
0,1,0,1,2,2,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,
3,0,0,1,1,0,1,0,0,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,0,
0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
3,0,1,0,1,0,1,1,0,1,1,0,0,0,1,1,0,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,
0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
3,0,0,0,1,1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,
3,2,2,1,2,2,2,2,2,2,2,1,2,2,1,2,2,1,1,1,1,1,1,1,1,2,1,1,0,3,3,3,
0,3,0,2,2,2,2,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,
2,2,2,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,1,2,2,2,1,1,1,2,0,1,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,0,2,2,0,0,0,0,0,0,
0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
2,3,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,1,0,2,1,0,
0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
3,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,
0,3,1,1,2,2,2,2,2,1,2,2,2,1,1,2,2,2,2,2,2,2,1,2,2,1,0,1,1,1,1,0,
0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
3,2,1,1,1,1,2,1,1,2,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,
0,0,2,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,0,0,
2,1,1,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,1,2,1,2,1,1,1,1,0,0,0,0,
0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
1,2,1,2,2,2,2,2,2,2,2,2,2,1,2,1,2,1,1,2,1,1,1,2,1,2,1,2,0,1,0,1,
0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,3,1,2,2,2,1,2,2,2,2,2,2,2,2,1,2,1,1,1,1,1,1,2,1,2,1,1,0,1,0,1,
0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
2,1,2,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,
0,2,0,1,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,
3,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
2,1,1,1,1,1,1,1,0,1,1,0,1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,2,0,1,1,1,0,1,0,0,0,1,1,0,1,1,0,0,0,0,0,1,1,0,0,
0,1,1,1,2,1,2,2,2,0,2,0,2,0,1,1,2,1,1,1,1,2,1,0,1,1,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,
1,0,1,0,0,0,0,0,1,0,1,2,2,0,1,0,0,1,1,2,2,1,2,0,2,0,0,0,1,2,0,1,
2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,2,0,2,1,2,0,2,0,0,1,1,1,1,1,1,0,1,0,0,0,1,0,0,1,
2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,1,0,0,0,0,0,1,0,2,1,1,0,1,0,0,1,1,1,2,2,0,0,1,0,0,0,1,0,0,1,
1,1,2,1,0,1,1,1,0,1,0,1,1,1,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,2,2,1,
0,2,0,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
2,1,0,0,1,0,1,1,1,1,0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
1,1,1,1,1,1,1,1,1,2,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1,1,1,0,1,1,0,1,0,0,0,1,1,0,1,
2,0,1,0,1,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,1,0,1,1,1,0,1,0,0,1,1,2,1,1,2,0,1,0,0,0,1,1,0,1,
1,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,1,0,1,1,2,0,1,0,0,0,0,2,1,1,2,0,2,0,0,0,1,1,0,1,
1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,1,0,2,1,1,0,1,0,0,2,2,1,2,1,1,0,1,0,0,0,1,1,0,1,
2,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,1,2,2,0,0,0,0,0,1,1,0,1,0,0,1,0,0,0,0,1,0,1,
1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,1,2,2,0,0,0,0,2,1,1,1,0,2,1,1,0,0,0,2,1,0,1,
1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,1,0,1,1,2,0,1,0,0,1,1,0,2,1,1,0,1,0,0,0,1,1,0,1,
2,2,1,1,1,0,1,1,0,1,1,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,1,0,2,1,1,0,1,0,0,1,1,0,1,2,1,0,2,0,0,0,1,1,0,1,
2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,
0,1,0,0,2,0,2,1,1,0,1,0,1,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,1,0,1,1,2,0,1,0,0,1,1,1,0,1,0,0,1,0,0,0,1,0,0,1,
1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
1,0,0,0,0,0,0,0,1,0,1,1,0,0,1,0,0,2,1,1,1,1,1,0,1,0,0,0,0,1,0,1,
0,1,1,1,2,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,1,1,1,1,1,0,1,0,0,0,1,1,0,0
];

jschardet.Win1255HebrewModel = {
    "charToOrderMap"        : jschardet.win1255_CharToOrderMap,
    "precedenceMatrix"      : jschardet.HebrewLangModel,
    "mTypicalPositiveRatio" : 0.984004,
    "keepEnglishLetter"     : false,
    "charsetName"           : "windows-1255"
};

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],27:[function(require,module,exports){
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
    
// 255: Control characters that usually does not exist in any text
// 254: Carriage/Return
// 253: symbol (punctuation) that does not belong to word
// 252: 0 - 9

// Character Mapping Table:
jschardet.Latin2_HungarianCharToOrderMap = []

jschardet.win1250HungarianCharToOrderMap = [];

// Model Table: 
// total sequences: 100%
// first 512 sequences: 94.7368%
// first 1024 sequences:5.2623%
// rest  sequences:     0.8894%
// negative sequences:  0.0009% 
jschardet.HungarianLangModel = [];

jschardet.Latin2HungarianModel = {
    "charToOrderMap"        : jschardet.Latin2_HungarianCharToOrderMap,
    "precedenceMatrix"      : jschardet.HungarianLangModel,
    "mTypicalPositiveRatio" : 0.947368,
    "keepEnglishLetter"     : true,
    "charsetName"           : "ISO-8859-2"
};

jschardet.Win1250HungarianModel = {
    "charToOrderMap"        : jschardet.win1250HungarianCharToOrderMap,
    "precedenceMatrix"      : jschardet.HungarianLangModel,
    "mTypicalPositiveRatio" : 0.947368,
    "keepEnglishLetter"     : true,
    "charsetName"           : "windows-1250"
};

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],28:[function(require,module,exports){
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
    
// 255: Control characters that usually does not exist in any text
// 254: Carriage/Return
// 253: symbol (punctuation) that does not belong to word
// 252: 0 - 9

// The following result for thai was collected from a limited sample (1M). 

// Character Mapping Table:
jschardet.TIS620CharToOrderMap = [
255,255,255,255,255,255,255,255,255,255,254,255,255,254,255,255,  // 00
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,  // 10
253,253,253,253,253,253,253,253,253,253,253,253,253,253,253,253,  // 20
252,252,252,252,252,252,252,252,252,252,253,253,253,253,253,253,  // 30
253,182,106,107,100,183,184,185,101, 94,186,187,108,109,110,111,  // 40
188,189,190, 89, 95,112,113,191,192,193,194,253,253,253,253,253,  // 50
253, 64, 72, 73,114, 74,115,116,102, 81,201,117, 90,103, 78, 82,  // 60
 96,202, 91, 79, 84,104,105, 97, 98, 92,203,253,253,253,253,253,  // 70
209,210,211,212,213, 88,214,215,216,217,218,219,220,118,221,222,
223,224, 99, 85, 83,225,226,227,228,229,230,231,232,233,234,235,
236,  5, 30,237, 24,238, 75,  8, 26, 52, 34, 51,119, 47, 58, 57,
 49, 53, 55, 43, 20, 19, 44, 14, 48,  3, 17, 25, 39, 62, 31, 54,
 45,  9, 16,  2, 61, 15,239, 12, 42, 46, 18, 21, 76,  4, 66, 63,
 22, 10,  1, 36, 23, 13, 40, 27, 32, 35, 86,240,241,242,243,244,
 11, 28, 41, 29, 33,245, 50, 37,  6,  7, 67, 77, 38, 93,246,247,
 68, 56, 59, 65, 69, 60, 70, 80, 71, 87,248,249,250,251,252,253
];

// Model Table: 
// total sequences: 100%
// first 512 sequences: 92.6386%
// first 1024 sequences:7.3177%
// rest  sequences:     1.0230%
// negative sequences:  0.0436% 
jschardet.ThaiLangModel = [];

jschardet.TIS620ThaiModel = {
    "charToOrderMap"        : jschardet.TIS620CharToOrderMap,
    "precedenceMatrix"      : jschardet.ThaiLangModel,
    "mTypicalPositiveRatio" : 0.926386,
    "keepEnglishLetter"     : false,
    "charsetName"           : "TIS-620"
};

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],29:[function(require,module,exports){
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
},{"_process":41}],30:[function(require,module,exports){
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
},{"_process":41}],31:[function(require,module,exports){
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
        //new jschardet.SJISProber(),
        //new jschardet.EUCJPProber(),
        //new jschardet.GB2312Prober(),
        //new jschardet.EUCKRProber(),
        //new jschardet.Big5Prober(),
        //new jschardet.EUCTWProber()
    ];
    this.reset();
}
jschardet.MBCSGroupProber.prototype = new jschardet.CharSetGroupProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],32:[function(require,module,exports){
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
    
// BIG5 

jschardet.BIG5_cls = [
    1,1,1,1,1,1,1,1,  // 00 - 07    //allow 0x00 as legal value
    1,1,1,1,1,1,0,0,  // 08 - 0f 
    1,1,1,1,1,1,1,1,  // 10 - 17 
    1,1,1,0,1,1,1,1,  // 18 - 1f 
    1,1,1,1,1,1,1,1,  // 20 - 27 
    1,1,1,1,1,1,1,1,  // 28 - 2f 
    1,1,1,1,1,1,1,1,  // 30 - 37 
    1,1,1,1,1,1,1,1,  // 38 - 3f 
    2,2,2,2,2,2,2,2,  // 40 - 47 
    2,2,2,2,2,2,2,2,  // 48 - 4f 
    2,2,2,2,2,2,2,2,  // 50 - 57 
    2,2,2,2,2,2,2,2,  // 58 - 5f 
    2,2,2,2,2,2,2,2,  // 60 - 67 
    2,2,2,2,2,2,2,2,  // 68 - 6f 
    2,2,2,2,2,2,2,2,  // 70 - 77 
    2,2,2,2,2,2,2,1,  // 78 - 7f 
    4,4,4,4,4,4,4,4,  // 80 - 87 
    4,4,4,4,4,4,4,4,  // 88 - 8f 
    4,4,4,4,4,4,4,4,  // 90 - 97 
    4,4,4,4,4,4,4,4,  // 98 - 9f 
    4,3,3,3,3,3,3,3,  // a0 - a7 
    3,3,3,3,3,3,3,3,  // a8 - af 
    3,3,3,3,3,3,3,3,  // b0 - b7 
    3,3,3,3,3,3,3,3,  // b8 - bf 
    3,3,3,3,3,3,3,3,  // c0 - c7 
    3,3,3,3,3,3,3,3,  // c8 - cf 
    3,3,3,3,3,3,3,3,  // d0 - d7 
    3,3,3,3,3,3,3,3,  // d8 - df 
    3,3,3,3,3,3,3,3,  // e0 - e7 
    3,3,3,3,3,3,3,3,  // e8 - ef 
    3,3,3,3,3,3,3,3,  // f0 - f7 
    3,3,3,3,3,3,3,0   // f8 - ff 
];

with( jschardet.Constants )
jschardet.BIG5_st = [
    error,start,start,    3,error,error,error,error, //00-07 
    error,error,itsMe,itsMe,itsMe,itsMe,itsMe,error, //08-0f 
    error,start,start,start,start,start,start,start  //10-17 
];

jschardet.Big5CharLenTable = [0, 1, 1, 2, 0];

jschardet.Big5SMModel = {
    "classTable"    : jschardet.BIG5_cls,
    "classFactor"   : 5,
    "stateTable"    : jschardet.BIG5_st,
    "charLenTable"  : jschardet.Big5CharLenTable,
    "name"          : "Big5"
};

// EUC-JP

jschardet.EUCJP_cls = [
    4,4,4,4,4,4,4,4,  // 00 - 07 
    4,4,4,4,4,4,5,5,  // 08 - 0f 
    4,4,4,4,4,4,4,4,  // 10 - 17 
    4,4,4,5,4,4,4,4,  // 18 - 1f 
    4,4,4,4,4,4,4,4,  // 20 - 27 
    4,4,4,4,4,4,4,4,  // 28 - 2f 
    4,4,4,4,4,4,4,4,  // 30 - 37 
    4,4,4,4,4,4,4,4,  // 38 - 3f 
    4,4,4,4,4,4,4,4,  // 40 - 47 
    4,4,4,4,4,4,4,4,  // 48 - 4f 
    4,4,4,4,4,4,4,4,  // 50 - 57 
    4,4,4,4,4,4,4,4,  // 58 - 5f 
    4,4,4,4,4,4,4,4,  // 60 - 67 
    4,4,4,4,4,4,4,4,  // 68 - 6f 
    4,4,4,4,4,4,4,4,  // 70 - 77 
    4,4,4,4,4,4,4,4,  // 78 - 7f 
    5,5,5,5,5,5,5,5,  // 80 - 87 
    5,5,5,5,5,5,1,3,  // 88 - 8f 
    5,5,5,5,5,5,5,5,  // 90 - 97 
    5,5,5,5,5,5,5,5,  // 98 - 9f 
    5,2,2,2,2,2,2,2,  // a0 - a7 
    2,2,2,2,2,2,2,2,  // a8 - af 
    2,2,2,2,2,2,2,2,  // b0 - b7 
    2,2,2,2,2,2,2,2,  // b8 - bf 
    2,2,2,2,2,2,2,2,  // c0 - c7 
    2,2,2,2,2,2,2,2,  // c8 - cf 
    2,2,2,2,2,2,2,2,  // d0 - d7 
    2,2,2,2,2,2,2,2,  // d8 - df 
    0,0,0,0,0,0,0,0,  // e0 - e7 
    0,0,0,0,0,0,0,0,  // e8 - ef 
    0,0,0,0,0,0,0,0,  // f0 - f7 
    0,0,0,0,0,0,0,5   // f8 - ff 
];

with( jschardet.Constants )
jschardet.EUCJP_st = [
         3,    4,    3,    5,start,error,error,error, //00-07 
     error,error,error,error,itsMe,itsMe,itsMe,itsMe, //08-0f 
     itsMe,itsMe,start,error,start,error,error,error, //10-17 
     error,error,start,error,error,error,    3,error, //18-1f 
         3,error,error,error,start,start,start,start  //20-27 
];

jschardet.EUCJPCharLenTable = [2, 2, 2, 3, 1, 0];

jschardet.EUCJPSMModel = {
    "classTable"    : jschardet.EUCJP_cls,
    "classFactor"   : 6,
    "stateTable"    : jschardet.EUCJP_st,
    "charLenTable"  : jschardet.EUCJPCharLenTable,
    "name"          : "EUC-JP"
};

// EUC-KR

jschardet.EUCKR_cls  = [
    1,1,1,1,1,1,1,1,  // 00 - 07 
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
    0,0,0,0,0,0,0,0,  // 80 - 87 
    0,0,0,0,0,0,0,0,  // 88 - 8f 
    0,0,0,0,0,0,0,0,  // 90 - 97 
    0,0,0,0,0,0,0,0,  // 98 - 9f 
    0,2,2,2,2,2,2,2,  // a0 - a7 
    2,2,2,2,2,3,3,3,  // a8 - af 
    2,2,2,2,2,2,2,2,  // b0 - b7 
    2,2,2,2,2,2,2,2,  // b8 - bf 
    2,2,2,2,2,2,2,2,  // c0 - c7 
    2,3,2,2,2,2,2,2,  // c8 - cf 
    2,2,2,2,2,2,2,2,  // d0 - d7 
    2,2,2,2,2,2,2,2,  // d8 - df 
    2,2,2,2,2,2,2,2,  // e0 - e7 
    2,2,2,2,2,2,2,2,  // e8 - ef 
    2,2,2,2,2,2,2,2,  // f0 - f7 
    2,2,2,2,2,2,2,0   // f8 - ff 
];

with( jschardet.Constants )
jschardet.EUCKR_st = [
    error,start,    3,error,error,error,error,error, //00-07 
    itsMe,itsMe,itsMe,itsMe,error,error,start,start  //08-0f 
];

jschardet.EUCKRCharLenTable = [0, 1, 2, 0];

jschardet.EUCKRSMModel = {
    "classTable"    : jschardet.EUCKR_cls,
    "classFactor"   : 4,
    "stateTable"    : jschardet.EUCKR_st,
    "charLenTable"  : jschardet.EUCKRCharLenTable,
    "name"          : "EUC-KR"
};

// EUC-TW

jschardet.EUCTW_cls = [
    2,2,2,2,2,2,2,2,  // 00 - 07 
    2,2,2,2,2,2,0,0,  // 08 - 0f 
    2,2,2,2,2,2,2,2,  // 10 - 17 
    2,2,2,0,2,2,2,2,  // 18 - 1f 
    2,2,2,2,2,2,2,2,  // 20 - 27 
    2,2,2,2,2,2,2,2,  // 28 - 2f 
    2,2,2,2,2,2,2,2,  // 30 - 37 
    2,2,2,2,2,2,2,2,  // 38 - 3f 
    2,2,2,2,2,2,2,2,  // 40 - 47 
    2,2,2,2,2,2,2,2,  // 48 - 4f 
    2,2,2,2,2,2,2,2,  // 50 - 57 
    2,2,2,2,2,2,2,2,  // 58 - 5f 
    2,2,2,2,2,2,2,2,  // 60 - 67 
    2,2,2,2,2,2,2,2,  // 68 - 6f 
    2,2,2,2,2,2,2,2,  // 70 - 77 
    2,2,2,2,2,2,2,2,  // 78 - 7f 
    0,0,0,0,0,0,0,0,  // 80 - 87 
    0,0,0,0,0,0,6,0,  // 88 - 8f 
    0,0,0,0,0,0,0,0,  // 90 - 97 
    0,0,0,0,0,0,0,0,  // 98 - 9f 
    0,3,4,4,4,4,4,4,  // a0 - a7 
    5,5,1,1,1,1,1,1,  // a8 - af 
    1,1,1,1,1,1,1,1,  // b0 - b7 
    1,1,1,1,1,1,1,1,  // b8 - bf 
    1,1,3,1,3,3,3,3,  // c0 - c7 
    3,3,3,3,3,3,3,3,  // c8 - cf 
    3,3,3,3,3,3,3,3,  // d0 - d7 
    3,3,3,3,3,3,3,3,  // d8 - df 
    3,3,3,3,3,3,3,3,  // e0 - e7 
    3,3,3,3,3,3,3,3,  // e8 - ef 
    3,3,3,3,3,3,3,3,  // f0 - f7 
    3,3,3,3,3,3,3,0   // f8 - ff 
];

with( jschardet.Constants )
jschardet.EUCTW_st = [
    error,error,start,    3,    3,    3,    4,error, //00-07 
    error,error,error,error,error,error,itsMe,itsMe, //08-0f 
    itsMe,itsMe,itsMe,itsMe,itsMe,error,start,error, //10-17 
    start,start,start,error,error,error,error,error, //18-1f 
        5,error,error,error,start,error,start,start, //20-27 
    start,error,start,start,start,start,start,start  //28-2f 
];

jschardet.EUCTWCharLenTable = [0, 0, 1, 2, 2, 2, 3];

jschardet.EUCTWSMModel = {
    "classTable"    : jschardet.EUCTW_cls,
    "classFactor"   : 7,
    "stateTable"    : jschardet.EUCTW_st,
    "charLenTable"  : jschardet.EUCTWCharLenTable,
    "name"          : "x-euc-tw"
};

// GB2312

jschardet.GB2312_cls = [
    1,1,1,1,1,1,1,1,  // 00 - 07 
    1,1,1,1,1,1,0,0,  // 08 - 0f 
    1,1,1,1,1,1,1,1,  // 10 - 17 
    1,1,1,0,1,1,1,1,  // 18 - 1f 
    1,1,1,1,1,1,1,1,  // 20 - 27 
    1,1,1,1,1,1,1,1,  // 28 - 2f 
    3,3,3,3,3,3,3,3,  // 30 - 37 
    3,3,1,1,1,1,1,1,  // 38 - 3f 
    2,2,2,2,2,2,2,2,  // 40 - 47 
    2,2,2,2,2,2,2,2,  // 48 - 4f 
    2,2,2,2,2,2,2,2,  // 50 - 57 
    2,2,2,2,2,2,2,2,  // 58 - 5f 
    2,2,2,2,2,2,2,2,  // 60 - 67 
    2,2,2,2,2,2,2,2,  // 68 - 6f 
    2,2,2,2,2,2,2,2,  // 70 - 77 
    2,2,2,2,2,2,2,4,  // 78 - 7f 
    5,6,6,6,6,6,6,6,  // 80 - 87 
    6,6,6,6,6,6,6,6,  // 88 - 8f 
    6,6,6,6,6,6,6,6,  // 90 - 97 
    6,6,6,6,6,6,6,6,  // 98 - 9f 
    6,6,6,6,6,6,6,6,  // a0 - a7 
    6,6,6,6,6,6,6,6,  // a8 - af 
    6,6,6,6,6,6,6,6,  // b0 - b7 
    6,6,6,6,6,6,6,6,  // b8 - bf 
    6,6,6,6,6,6,6,6,  // c0 - c7 
    6,6,6,6,6,6,6,6,  // c8 - cf 
    6,6,6,6,6,6,6,6,  // d0 - d7 
    6,6,6,6,6,6,6,6,  // d8 - df 
    6,6,6,6,6,6,6,6,  // e0 - e7 
    6,6,6,6,6,6,6,6,  // e8 - ef 
    6,6,6,6,6,6,6,6,  // f0 - f7 
    6,6,6,6,6,6,6,0   // f8 - ff 
];

with( jschardet.Constants )
jschardet.GB2312_st = [
    error,start,start,start,start,start,    3,error, //00-07 
    error,error,error,error,error,error,itsMe,itsMe, //08-0f 
    itsMe,itsMe,itsMe,itsMe,itsMe,error,error,start, //10-17 
        4,error,start,start,error,error,error,error, //18-1f 
    error,error,    5,error,error,error,itsMe,error, //20-27 
    error,error,start,start,start,start,start,start  //28-2f 
];

// To be accurate, the length of class 6 can be either 2 or 4. 
// But it is not necessary to discriminate between the two since 
// it is used for frequency analysis only, and we are validing 
// each code range there as well. So it is safe to set it to be 
// 2 here. 
jschardet.GB2312CharLenTable = [0, 1, 1, 1, 1, 1, 2];

jschardet.GB2312SMModel = {
    "classTable"    : jschardet.GB2312_cls,
    "classFactor"   : 7,
    "stateTable"    : jschardet.GB2312_st,
    "charLenTable"  : jschardet.GB2312CharLenTable,
    "name"          : "GB2312"
};

// Shift_JIS

jschardet.SJIS_cls = [
    1,1,1,1,1,1,1,1,  // 00 - 07 
    1,1,1,1,1,1,0,0,  // 08 - 0f 
    1,1,1,1,1,1,1,1,  // 10 - 17 
    1,1,1,0,1,1,1,1,  // 18 - 1f 
    1,1,1,1,1,1,1,1,  // 20 - 27 
    1,1,1,1,1,1,1,1,  // 28 - 2f 
    1,1,1,1,1,1,1,1,  // 30 - 37 
    1,1,1,1,1,1,1,1,  // 38 - 3f 
    2,2,2,2,2,2,2,2,  // 40 - 47 
    2,2,2,2,2,2,2,2,  // 48 - 4f 
    2,2,2,2,2,2,2,2,  // 50 - 57 
    2,2,2,2,2,2,2,2,  // 58 - 5f 
    2,2,2,2,2,2,2,2,  // 60 - 67 
    2,2,2,2,2,2,2,2,  // 68 - 6f 
    2,2,2,2,2,2,2,2,  // 70 - 77 
    2,2,2,2,2,2,2,1,  // 78 - 7f 
    3,3,3,3,3,3,3,3,  // 80 - 87 
    3,3,3,3,3,3,3,3,  // 88 - 8f 
    3,3,3,3,3,3,3,3,  // 90 - 97 
    3,3,3,3,3,3,3,3,  // 98 - 9f 
    // 0xa0 is illegal in sjis encoding, but some pages does 
    // contain such byte. We need to be more error forgiven.
    2,2,2,2,2,2,2,2,  // a0 - a7     
    2,2,2,2,2,2,2,2,  // a8 - af 
    2,2,2,2,2,2,2,2,  // b0 - b7 
    2,2,2,2,2,2,2,2,  // b8 - bf 
    2,2,2,2,2,2,2,2,  // c0 - c7 
    2,2,2,2,2,2,2,2,  // c8 - cf 
    2,2,2,2,2,2,2,2,  // d0 - d7 
    2,2,2,2,2,2,2,2,  // d8 - df 
    3,3,3,3,3,3,3,3,  // e0 - e7 
    3,3,3,3,3,4,4,4,  // e8 - ef 
    4,4,4,4,4,4,4,4,  // f0 - f7 
    4,4,4,4,4,0,0,0   // f8 - ff 
];

with( jschardet.Constants )
jschardet.SJIS_st = [
    error,start,start,    3,error,error,error,error, //00-07 
    error,error,error,error,itsMe,itsMe,itsMe,itsMe, //08-0f 
    itsMe,itsMe,error,error,start,start,start,start  //10-17 
];

jschardet.SJISCharLenTable = [0, 1, 1, 2, 0, 0];

jschardet.SJISSMModel = {
    "classTable"    : jschardet.SJIS_cls,
    "classFactor"   : 6,
    "stateTable"    : jschardet.SJIS_st,
    "charLenTable"  : jschardet.SJISCharLenTable,
    "name"          : "Shift_JIS"
};

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
},{"_process":41}],33:[function(require,module,exports){
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
},{"_process":41}],34:[function(require,module,exports){
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
    
jschardet.SBCSGroupProber = function() {
    jschardet.CharSetGroupProber.apply(this);
    
    var self = this;
    
    function init() {
        self._mProbers = [
            //new jschardet.SingleByteCharSetProber(jschardet.Win1251CyrillicModel),
            //new jschardet.SingleByteCharSetProber(jschardet.Koi8rModel),
            //new jschardet.SingleByteCharSetProber(jschardet.Latin5CyrillicModel),
            //new jschardet.SingleByteCharSetProber(jschardet.MacCyrillicModel),
            //new jschardet.SingleByteCharSetProber(jschardet.Ibm866Model),
            //new jschardet.SingleByteCharSetProber(jschardet.Ibm855Model),
            //new jschardet.SingleByteCharSetProber(jschardet.Latin7GreekModel),
            //new jschardet.SingleByteCharSetProber(jschardet.Win1253GreekModel),
            //new jschardet.SingleByteCharSetProber(jschardet.Latin5BulgarianModel),
            //new jschardet.SingleByteCharSetProber(jschardet.Win1251BulgarianModel),
            //new jschardet.SingleByteCharSetProber(jschardet.Latin2HungarianModel),
            //new jschardet.SingleByteCharSetProber(jschardet.Win1250HungarianModel),
            //new jschardet.SingleByteCharSetProber(jschardet.TIS620ThaiModel)
        ];
        //var hebrewProber = new jschardet.HebrewProber();
        //var logicalHebrewProber = new jschardet.SingleByteCharSetProber(jschardet.Win1255HebrewModel, false, hebrewProber);
        //var visualHebrewProber = new jschardet.SingleByteCharSetProber(jschardet.Win1255HebrewModel, true, hebrewProber);
        //hebrewProber.setModelProbers(logicalHebrewProber, visualHebrewProber);
        //self._mProbers.push(hebrewProber, logicalHebrewProber, visualHebrewProber);
        
        self.reset();
    }
    
    init();
}
jschardet.SBCSGroupProber.prototype = new jschardet.CharSetGroupProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],35:[function(require,module,exports){
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
    
jschardet.SJISProber = function() {
    jschardet.MultiByteCharSetProber.apply(this);
    
    var self = this;
    
    function init() {
        self._mCodingSM = new jschardet.CodingStateMachine(jschardet.SJISSMModel);
        self._mDistributionAnalyzer = new jschardet.SJISDistributionAnalysis();
        self._mContextAnalyzer = new jschardet.SJISContextAnalysis();
        self.reset();
    }
    
    this.reset = function() {
        jschardet.SJISProber.prototype.reset.apply(this);
        this._mContextAnalyzer.reset();
    }
    
    this.getCharsetName = function() {
        return "SHIFT_JIS";
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
                    this._mContextAnalyzer.feed(this._mLastChar.slice(2 - charLen), charLen);
                    this._mDistributionAnalyzer.feed(this._mLastChar, charLen);
                } else {
                    this._mContextAnalyzer.feed(aBuf.slice(i + 1 - charLen, i + 3 - charLen), charLen);
                    this._mDistributionAnalyzer.feed(aBuf.slice(i - 1, i + 1), charLen);
                }
            }
        }
        
        this._mLastChar[0] = aBuf[aLen - 1];
        
        if( this.getState() == jschardet.Constants.detecting ) {
            if( this._mContextAnalyzer.gotEnoughData() &&
                this.getConfidence() > jschardet.Constants.SHORTCUT_THRESHOLD ) {
                this._mState = jschardet.Constants.foundIt;
            }
        }
        
        return this.getState();
    }
    
    this.getConfidence = function() {
        var contxtCf = this._mContextAnalyzer.getConfidence();
        var distribCf = this._mDistributionAnalyzer.getConfidence();
        return Math.max(contxtCf, distribCf);
    }
    
    init();
}
jschardet.SJISProber.prototype = new jschardet.MultiByteCharSetProber();

}(jschardet);
}).call(this,require('_process'))
},{"_process":41}],36:[function(require,module,exports){
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
                    //new jschardet.SBCSGroupProber(),
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
},{"_process":41}],37:[function(require,module,exports){
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
},{"_process":41}],38:[function(require,module,exports){
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

},{"base64-js":39,"ieee754":40}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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
