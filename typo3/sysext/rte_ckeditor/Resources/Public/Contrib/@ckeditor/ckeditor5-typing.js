import{Command as e,Plugin as t}from"@ckeditor/ckeditor5-core";import{env as i,EventInfo as n,count as o,keyCodes as s,isInsideSurrogatePair as r,isInsideCombinedSymbol as a,isInsideEmojiSequence as c,ObservableMixin as l}from"@ckeditor/ckeditor5-utils";import{Observer as d,FocusObserver as u,DomEventData as h,LiveRange as m,BubblingEventInfo as f,MouseObserver as g}from"@ckeditor/ckeditor5-engine";import{debounce as p,escapeRegExp as b}from"lodash-es";
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */class _{constructor(e,t=20){this._batch=null,this.model=e,this._size=0,this.limit=t,this._isLocked=!1,this._changeCallback=(e,t)=>{t.isLocal&&t.isUndoable&&t!==this._batch&&this._reset(!0)},this._selectionChangeCallback=()=>{this._reset()},this.model.document.on("change",this._changeCallback),this.model.document.selection.on("change:range",this._selectionChangeCallback),this.model.document.selection.on("change:attribute",this._selectionChangeCallback)}get batch(){return this._batch||(this._batch=this.model.createBatch({isTyping:!0})),this._batch}get size(){return this._size}input(e){this._size+=e,this._size>=this.limit&&this._reset(!0)}get isLocked(){return this._isLocked}lock(){this._isLocked=!0}unlock(){this._isLocked=!1}destroy(){this.model.document.off("change",this._changeCallback),this.model.document.selection.off("change:range",this._selectionChangeCallback),this.model.document.selection.off("change:attribute",this._selectionChangeCallback)}_reset(e=!1){this.isLocked&&!e||(this._batch=null,this._size=0)}}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */class y extends e{constructor(e,t){super(e),this._buffer=new _(e.model,t),this._isEnabledBasedOnSelection=!1}get buffer(){return this._buffer}destroy(){super.destroy(),this._buffer.destroy()}execute(e={}){const t=this.editor.model,i=t.document,n=e.text||"",o=n.length;let s=i.selection;if(e.selection?s=e.selection:e.range&&(s=t.createSelection(e.range)),!t.canEditAt(s))return;const r=e.resultRange;t.enqueueChange(this._buffer.batch,(e=>{this._buffer.lock();const a=Array.from(i.selection.getAttributes());t.deleteContent(s),n&&t.insertContent(e.createText(n,a),s),r?e.setSelection(r):s.is("documentSelection")||e.setSelection(s),this._buffer.unlock(),this._buffer.input(o)}))}}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */const v=["insertText","insertReplacementText"],C=[...v,"insertCompositionText"];class k extends d{constructor(e){super(e),this.focusObserver=e.getObserver(u);const t=i.isAndroid?C:v,o=e.document;o.on("beforeinput",((i,s)=>{if(!this.isEnabled)return;const{data:r,targetRanges:a,inputType:c,domEvent:l}=s;if(!t.includes(c))return;this.focusObserver.flush();const d=new n(o,"insertText");o.fire(d,new h(e,l,{text:r,selection:e.createSelection(a)})),d.stop.called&&i.stop()})),i.isAndroid||o.on("compositionend",((t,{data:i,domEvent:n})=>{this.isEnabled&&i&&o.fire("insertText",new h(e,n,{text:i}))}),{priority:"lowest"})}observe(){}stopObserving(){}}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */class w extends t{static get pluginName(){return"Input"}init(){const e=this.editor,t=e.model,n=e.editing.view,o=e.editing.mapper,s=t.document.selection;this._compositionQueue=new x(e),n.addObserver(k);const r=new y(e,e.config.get("typing.undoStep")||20);e.commands.add("insertText",r),e.commands.add("input",r),this.listenTo(n.document,"insertText",((r,a)=>{n.document.isComposing||a.preventDefault(),i.isAndroid&&n.document.isComposing&&this._compositionQueue.flush("next beforeinput");const{text:c,selection:l}=a;let d;d=l?Array.from(l.getRanges()).map((e=>o.toModelRange(e))):Array.from(s.getRanges());let u=c;if(i.isAndroid){const e=Array.from(d[0].getItems()).reduce(((e,t)=>e+(t.is("$textProxy")?t.data:"")),"");if(e&&(e.length<=u.length?u.startsWith(e)&&(u=u.substring(e.length),d[0].start=d[0].start.getShiftedBy(e.length)):e.startsWith(u)&&(d[0].start=d[0].start.getShiftedBy(u.length),u="")),0==u.length&&d[0].isCollapsed)return}const h={text:u,selection:t.createSelection(d)};i.isAndroid&&n.document.isComposing?this._compositionQueue.push(h):(e.execute("insertText",h),n.scrollToTheSelection())})),i.isAndroid?this.listenTo(n.document,"keydown",((e,i)=>{!s.isCollapsed&&229==i.keyCode&&n.document.isComposing&&T(t,r)})):this.listenTo(n.document,"compositionstart",(()=>{s.isCollapsed||T(t,r)})),i.isAndroid?(this.listenTo(n.document,"mutations",((e,{mutations:t})=>{if(n.document.isComposing)for(const{node:e}of t){const t=E(e,o),i=o.toModelElement(t);if(this._compositionQueue.isComposedElement(i))return void this._compositionQueue.flush("mutations")}})),this.listenTo(n.document,"compositionend",(()=>{this._compositionQueue.flush("composition end")})),this.listenTo(n.document,"compositionend",(()=>{const e=[];for(const t of this._compositionQueue.flushComposedElements()){const i=o.toViewElement(t);i&&e.push({type:"children",node:i})}e.length&&n.document.fire("mutations",{mutations:e})}),{priority:"lowest"})):this.listenTo(n.document,"compositionend",(()=>{n.document.fire("mutations",{mutations:[]})}),{priority:"lowest"})}destroy(){super.destroy(),this._compositionQueue.destroy()}}class x{constructor(e){this.flushDebounced=p((()=>this.flush("timeout")),50),this._queue=[],this._compositionElements=new Set,this.editor=e}destroy(){for(this.flushDebounced.cancel(),this._compositionElements.clear();this._queue.length;)this.shift()}get length(){return this._queue.length}push(e){const t={text:e.text};if(e.selection){t.selectionRanges=[];for(const i of e.selection.getRanges())t.selectionRanges.push(m.fromRange(i)),this._compositionElements.add(i.start.parent)}this._queue.push(t),this.flushDebounced()}shift(){const e=this._queue.shift(),t={text:e.text};if(e.selectionRanges){const i=e.selectionRanges.map((e=>function(e){const t=e.toRange();if(e.detach(),"$graveyard"==t.root.rootName)return null;return t}(e))).filter((e=>!!e));i.length&&(t.selection=this.editor.model.createSelection(i))}return t}flush(e){const t=this.editor,i=t.model,n=t.editing.view;if(this.flushDebounced.cancel(),!this._queue.length)return;const o=t.commands.get("insertText").buffer;i.enqueueChange(o.batch,(()=>{for(o.lock();this._queue.length;){const e=this.shift();t.execute("insertText",e)}o.unlock()})),n.scrollToTheSelection()}isComposedElement(e){return this._compositionElements.has(e)}flushComposedElements(){const e=Array.from(this._compositionElements);return this._compositionElements.clear(),e}}function T(e,t){if(!t.isEnabled)return;const i=t.buffer;i.lock(),e.enqueueChange(i.batch,(()=>{e.deleteContent(e.document.selection)})),i.unlock()}function E(e,t){let i=e.is("$text")?e.parent:e;for(;!t.toModelElement(i);)i=i.parent;return i}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */class S extends e{constructor(e,t){super(e),this.direction=t,this._buffer=new _(e.model,e.config.get("typing.undoStep")),this._isEnabledBasedOnSelection=!1}get buffer(){return this._buffer}execute(e={}){const t=this.editor.model,i=t.document;t.enqueueChange(this._buffer.batch,(n=>{this._buffer.lock();const s=n.createSelection(e.selection||i.selection);if(!t.canEditAt(s))return;const r=e.sequence||1,a=s.isCollapsed;if(s.isCollapsed&&t.modifySelection(s,{direction:this.direction,unit:e.unit,treatEmojiAsSingleUnit:!0}),this._shouldEntireContentBeReplacedWithParagraph(r))return void this._replaceEntireContentWithParagraph(n);if(this._shouldReplaceFirstBlockWithParagraph(s,r))return void this.editor.execute("paragraph",{selection:s});if(s.isCollapsed)return;let c=0;s.getFirstRange().getMinimalFlatRanges().forEach((e=>{c+=o(e.getWalker({singleCharacters:!0,ignoreElementEnd:!0,shallow:!0}))})),t.deleteContent(s,{doNotResetEntireContent:a,direction:this.direction}),this._buffer.input(c),n.setSelection(s),this._buffer.unlock()}))}_shouldEntireContentBeReplacedWithParagraph(e){if(e>1)return!1;const t=this.editor.model,i=t.document.selection,n=t.schema.getLimitElement(i);if(!(i.isCollapsed&&i.containsEntireContent(n)))return!1;if(!t.schema.checkChild(n,"paragraph"))return!1;const o=n.getChild(0);return!o||!o.is("element","paragraph")}_replaceEntireContentWithParagraph(e){const t=this.editor.model,i=t.document.selection,n=t.schema.getLimitElement(i),o=e.createElement("paragraph");e.remove(e.createRangeIn(n)),e.insert(o,n),e.setSelection(o,0)}_shouldReplaceFirstBlockWithParagraph(e,t){const i=this.editor.model;if(t>1||"backward"!=this.direction)return!1;if(!e.isCollapsed)return!1;const n=e.getFirstPosition(),o=i.schema.getLimitElement(n),s=o.getChild(0);return n.parent==s&&(!!e.containsEntireContent(s)&&(!!i.schema.checkChild(o,"paragraph")&&"paragraph"!=s.name))}}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */const A="word",R="selection",q="backward",B="forward",O={deleteContent:{unit:R,direction:q},deleteContentBackward:{unit:"codePoint",direction:q},deleteWordBackward:{unit:A,direction:q},deleteHardLineBackward:{unit:R,direction:q},deleteSoftLineBackward:{unit:R,direction:q},deleteContentForward:{unit:"character",direction:B},deleteWordForward:{unit:A,direction:B},deleteHardLineForward:{unit:R,direction:B},deleteSoftLineForward:{unit:R,direction:B}};class P extends d{constructor(e){super(e);const t=e.document;let n=0;t.on("keydown",(()=>{n++})),t.on("keyup",(()=>{n=0})),t.on("beforeinput",((o,s)=>{if(!this.isEnabled)return;const{targetRanges:l,domEvent:d,inputType:u}=s,m=O[u];if(!m)return;const g={direction:m.direction,unit:m.unit,sequence:n};g.unit==R&&(g.selectionToRemove=e.createSelection(l[0])),"deleteContentBackward"===u&&(i.isAndroid&&(g.sequence=1),function(e){if(1!=e.length||e[0].isCollapsed)return!1;const t=e[0].getWalker({direction:"backward",singleCharacters:!0,ignoreElementEnd:!0});let i=0;for(const{nextPosition:e,item:n}of t){if(e.parent.is("$text")){const t=e.parent.data,n=e.offset;if(r(t,n)||a(t,n)||c(t,n))continue;i++}else(n.is("containerElement")||n.is("emptyElement"))&&i++;if(i>1)return!0}return!1}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */(l)&&(g.unit=R,g.selectionToRemove=e.createSelection(l)));const p=new f(t,"delete",l[0]);t.fire(p,new h(e,d,g)),p.stop.called&&o.stop()})),i.isBlink&&function(e){const t=e.view,i=t.document;let n=null,o=!1;function r(e){return e==s.backspace||e==s.delete}function a(e){return e==s.backspace?q:B}i.on("keydown",((e,{keyCode:t})=>{n=t,o=!1})),i.on("keyup",((s,{keyCode:c,domEvent:l})=>{const d=i.selection,u=e.isEnabled&&c==n&&r(c)&&!d.isCollapsed&&!o;if(n=null,u){const e=d.getFirstRange(),n=new f(i,"delete",e),o={unit:R,direction:a(c),selectionToRemove:d};i.fire(n,new h(t,l,o))}})),i.on("beforeinput",((e,{inputType:t})=>{const i=O[t];r(n)&&i&&i.direction==a(n)&&(o=!0)}),{priority:"high"}),i.on("beforeinput",((e,{inputType:t,data:i})=>{n==s.delete&&"insertText"==t&&""==i&&e.stop()}),{priority:"high"})}(this)}observe(){}stopObserving(){}}class F extends t{static get pluginName(){return"Delete"}init(){const e=this.editor,t=e.editing.view,i=t.document,n=e.model.document;t.addObserver(P),this._undoOnBackspace=!1;const o=new S(e,"forward");e.commands.add("deleteForward",o),e.commands.add("forwardDelete",o),e.commands.add("delete",new S(e,"backward")),this.listenTo(i,"delete",((n,o)=>{i.isComposing||o.preventDefault();const{direction:s,sequence:r,selectionToRemove:a,unit:c}=o,l="forward"===s?"deleteForward":"delete",d={sequence:r};if("selection"==c){const t=Array.from(a.getRanges()).map((t=>e.editing.mapper.toModelRange(t)));d.selection=e.model.createSelection(t)}else d.unit=c;e.execute(l,d),t.scrollToTheSelection()}),{priority:"low"}),this.editor.plugins.has("UndoEditing")&&(this.listenTo(i,"delete",((t,i)=>{this._undoOnBackspace&&"backward"==i.direction&&1==i.sequence&&"codePoint"==i.unit&&(this._undoOnBackspace=!1,e.execute("undo"),i.preventDefault(),t.stop())}),{context:"$capture"}),this.listenTo(n,"change",(()=>{this._undoOnBackspace=!1})))}requestUndoOnBackspace(){this.editor.plugins.has("UndoEditing")&&(this._undoOnBackspace=!0)}}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */class L extends t{static get requires(){return[w,F]}static get pluginName(){return"Typing"}}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */function $(e,t){let i=e.start;return{text:Array.from(e.getWalker({ignoreElementEnd:!1})).reduce(((e,{item:n})=>n.is("$text")||n.is("$textProxy")?e+n.data:(i=t.createPositionAfter(n),"")),""),range:t.createRange(i,e.end)}}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */class G extends(l()){constructor(e,t){super(),this.model=e,this.testCallback=t,this._hasMatch=!1,this.set("isEnabled",!0),this.on("change:isEnabled",(()=>{this.isEnabled?this._startListening():(this.stopListening(e.document.selection),this.stopListening(e.document))})),this._startListening()}get hasMatch(){return this._hasMatch}_startListening(){const e=this.model.document;this.listenTo(e.selection,"change:range",((t,{directChange:i})=>{i&&(e.selection.isCollapsed?this._evaluateTextBeforeSelection("selection"):this.hasMatch&&(this.fire("unmatched"),this._hasMatch=!1))})),this.listenTo(e,"change:data",((e,t)=>{!t.isUndo&&t.isLocal&&this._evaluateTextBeforeSelection("data",{batch:t})}))}_evaluateTextBeforeSelection(e,t={}){const i=this.model,n=i.document.selection,o=i.createRange(i.createPositionAt(n.focus.parent,0),n.focus),{text:s,range:r}=$(o,i),a=this.testCallback(s);if(!a&&this.hasMatch&&this.fire("unmatched"),this._hasMatch=!!a,a){const i=Object.assign(t,{text:s,range:r});"object"==typeof a&&Object.assign(i,a),this.fire(`matched:${e}`,i)}}}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */class z extends t{static get pluginName(){return"TwoStepCaretMovement"}constructor(e){super(e),this._isNextGravityRestorationSkipped=!1,this.attributes=new Set,this._overrideUid=null}init(){const e=this.editor,t=e.model,i=e.editing.view,n=e.locale,o=t.document.selection;this.listenTo(i.document,"arrowKey",((e,t)=>{if(!o.isCollapsed)return;if(t.shiftKey||t.altKey||t.ctrlKey)return;const i=t.keyCode==s.arrowright,r=t.keyCode==s.arrowleft;if(!i&&!r)return;const a=n.contentLanguageDirection;let c=!1;c="ltr"===a&&i||"rtl"===a&&r?this._handleForwardMovement(t):this._handleBackwardMovement(t),!0===c&&e.stop()}),{context:"$text",priority:"highest"}),this.listenTo(o,"change:range",((e,t)=>{this._isNextGravityRestorationSkipped?this._isNextGravityRestorationSkipped=!1:this._isGravityOverridden&&(!t.directChange&&Q(o.getFirstPosition(),this.attributes)||this._restoreGravity())})),this._enableClickingAfterNode(),this._enableInsertContentSelectionAttributesFixer(),this._handleDeleteContentAfterNode()}registerAttribute(e){this.attributes.add(e)}_handleForwardMovement(e){const t=this.attributes,i=this.editor.model,n=i.document.selection,o=n.getFirstPosition();return!this._isGravityOverridden&&((!o.isAtStart||!D(n,t))&&(!!Q(o,t)&&(W(e),D(n,t)&&Q(o,t,!0)?M(i,t):this._overrideGravity(),!0)))}_handleBackwardMovement(e){const t=this.attributes,i=this.editor.model,n=i.document.selection,o=n.getFirstPosition();return this._isGravityOverridden?(W(e),this._restoreGravity(),Q(o,t,!0)?M(i,t):N(i,t,o),!0):o.isAtStart?!!D(n,t)&&(W(e),N(i,t,o),!0):!D(n,t)&&Q(o,t,!0)?(W(e),N(i,t,o),!0):!!U(o,t)&&(o.isAtEnd&&!D(n,t)&&Q(o,t)?(W(e),N(i,t,o),!0):(this._isNextGravityRestorationSkipped=!0,this._overrideGravity(),!1))}_enableClickingAfterNode(){const e=this.editor,t=e.model,i=t.document.selection,n=e.editing.view.document;e.editing.view.addObserver(g);let o=!1;this.listenTo(n,"mousedown",(()=>{o=!0})),this.listenTo(n,"selectionChange",(()=>{const e=this.attributes;if(!o)return;if(o=!1,!i.isCollapsed)return;if(!D(i,e))return;const n=i.getFirstPosition();Q(n,e)&&(n.isAtStart||Q(n,e,!0)?M(t,e):this._isGravityOverridden||this._overrideGravity())}))}_enableInsertContentSelectionAttributesFixer(){const e=this.editor.model,t=e.document.selection,i=this.attributes;this.listenTo(e,"insertContent",(()=>{const n=t.getFirstPosition();D(t,i)&&Q(n,i)&&M(e,i)}),{priority:"low"})}_handleDeleteContentAfterNode(){const e=this.editor,t=e.model,i=t.document.selection,n=e.editing.view;let o=!1,s=!1;this.listenTo(n.document,"delete",((e,t)=>{o="backward"===t.direction}),{priority:"high"}),this.listenTo(t,"deleteContent",(()=>{if(!o)return;const e=i.getFirstPosition();s=D(i,this.attributes)&&!U(e,this.attributes)}),{priority:"high"}),this.listenTo(t,"deleteContent",(()=>{o&&(o=!1,s||e.model.enqueueChange((()=>{const e=i.getFirstPosition();D(i,this.attributes)&&Q(e,this.attributes)&&(e.isAtStart||Q(e,this.attributes,!0)?M(t,this.attributes):this._isGravityOverridden||this._overrideGravity())})))}),{priority:"low"})}get _isGravityOverridden(){return!!this._overrideUid}_overrideGravity(){this._overrideUid=this.editor.model.change((e=>e.overrideSelectionGravity()))}_restoreGravity(){this.editor.model.change((e=>{e.restoreSelectionGravity(this._overrideUid),this._overrideUid=null}))}}function D(e,t){for(const i of t)if(e.hasAttribute(i))return!0;return!1}function N(e,t,i){const n=i.nodeBefore;e.change((i=>{if(n){const t=[],o=e.schema.isObject(n)&&e.schema.isInline(n);for(const[i,s]of n.getAttributes())!e.schema.checkAttribute("$text",i)||o&&!1===e.schema.getAttributeProperties(i).copyFromObject||t.push([i,s]);i.setSelectionAttribute(t)}else i.removeSelectionAttribute(t)}))}function M(e,t){e.change((e=>{e.removeSelectionAttribute(t)}))}function W(e){e.preventDefault()}function U(e,t){return Q(e.getShiftedBy(-1),t)}function Q(e,t,i=!1){const{nodeBefore:n,nodeAfter:o}=e;for(const e of t){const t=n?n.getAttribute(e):void 0,s=o?o.getAttribute(e):void 0;if((!i||void 0!==t&&void 0!==s)&&s!==t)return!0}return!1}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */const I={copyright:{from:"(c)",to:"©"},registeredTrademark:{from:"(r)",to:"®"},trademark:{from:"(tm)",to:"™"},oneHalf:{from:/(^|[^/a-z0-9])(1\/2)([^/a-z0-9])$/i,to:[null,"½",null]},oneThird:{from:/(^|[^/a-z0-9])(1\/3)([^/a-z0-9])$/i,to:[null,"⅓",null]},twoThirds:{from:/(^|[^/a-z0-9])(2\/3)([^/a-z0-9])$/i,to:[null,"⅔",null]},oneForth:{from:/(^|[^/a-z0-9])(1\/4)([^/a-z0-9])$/i,to:[null,"¼",null]},threeQuarters:{from:/(^|[^/a-z0-9])(3\/4)([^/a-z0-9])$/i,to:[null,"¾",null]},lessThanOrEqual:{from:"<=",to:"≤"},greaterThanOrEqual:{from:">=",to:"≥"},notEqual:{from:"!=",to:"≠"},arrowLeft:{from:"<-",to:"←"},arrowRight:{from:"->",to:"→"},horizontalEllipsis:{from:"...",to:"…"},enDash:{from:/(^| )(--)( )$/,to:[null,"–",null]},emDash:{from:/(^| )(---)( )$/,to:[null,"—",null]},quotesPrimary:{from:Y('"'),to:[null,"“",null,"”"]},quotesSecondary:{from:Y("'"),to:[null,"‘",null,"’"]},quotesPrimaryEnGb:{from:Y("'"),to:[null,"‘",null,"’"]},quotesSecondaryEnGb:{from:Y('"'),to:[null,"“",null,"”"]},quotesPrimaryPl:{from:Y('"'),to:[null,"„",null,"”"]},quotesSecondaryPl:{from:Y("'"),to:[null,"‚",null,"’"]}},j={symbols:["copyright","registeredTrademark","trademark"],mathematical:["oneHalf","oneThird","twoThirds","oneForth","threeQuarters","lessThanOrEqual","greaterThanOrEqual","notEqual","arrowLeft","arrowRight"],typography:["horizontalEllipsis","enDash","emDash"],quotes:["quotesPrimary","quotesSecondary"]},H=["symbols","mathematical","typography","quotes"];class K extends t{static get requires(){return["Delete","Input"]}static get pluginName(){return"TextTransformation"}constructor(e){super(e),e.config.define("typing",{transformations:{include:H}})}init(){const e=this.editor.model.document.selection;e.on("change:range",(()=>{this.isEnabled=!e.anchor.parent.is("element","codeBlock")})),this._enableTransformationWatchers()}_enableTransformationWatchers(){const e=this.editor,t=e.model,i=e.plugins.get("Delete"),n=function(e){const t=e.extra||[],i=e.remove||[],n=e=>!i.includes(e);return function(e){const t=new Set;for(const i of e)if("string"==typeof i&&j[i])for(const e of j[i])t.add(e);else t.add(i);return Array.from(t)}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */(e.include.concat(t).filter(n)).filter(n).map((e=>"string"==typeof e&&I[e]?I[e]:e)).filter((e=>"object"==typeof e)).map((e=>({from:V(e.from),to:J(e.to)})))}(e.config.get("typing.transformations")),o=new G(e.model,(e=>{for(const t of n){if(t.from.test(e))return{normalizedTransformation:t}}}));o.on("matched:data",((e,n)=>{if(!n.batch.isTyping)return;const{from:o,to:s}=n.normalizedTransformation,r=o.exec(n.text),a=s(r.slice(1)),c=n.range;let l=r.index;t.enqueueChange((e=>{for(let i=1;i<r.length;i++){const n=r[i],o=a[i-1];if(null==o){l+=n.length;continue}const s=c.start.getShiftedBy(l),d=t.createRange(s,s.getShiftedBy(n.length)),u=X(s);t.insertContent(e.createText(o,u),d),l+=o.length}t.enqueueChange((()=>{i.requestUndoOnBackspace()}))}))})),o.bind("isEnabled").to(this)}}function V(e){return"string"==typeof e?new RegExp(`(${b(e)})$`):e}function J(e){return"string"==typeof e?()=>[e]:e instanceof Array?()=>e:e}function X(e){return(e.textNode?e.textNode:e.nodeAfter).getAttributes()}function Y(e){return new RegExp(`(^|\\s)(${e})([^${e}]*)(${e})$`)}function Z(e,t,i,n){return n.createRange(ee(e,t,i,!0,n),ee(e,t,i,!1,n))}function ee(e,t,i,n,o){let s=e.textNode||(n?e.nodeBefore:e.nodeAfter),r=null;for(;s&&s.getAttribute(t)==i;)r=s,s=n?s.previousSibling:s.nextSibling;return r?o.createPositionAt(r,n?"before":"after"):e}
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */function te(e,t,i,n){const o=e.editing.view,s=new Set;o.document.registerPostFixer((o=>{const r=e.model.document.selection;let a=!1;if(r.hasAttribute(t)){const c=Z(r.getFirstPosition(),t,r.getAttribute(t),e.model),l=e.editing.mapper.toViewRange(c);for(const e of l.getItems())e.is("element",i)&&!e.hasClass(n)&&(o.addClass(n,e),s.add(e),a=!0)}return a})),e.conversion.for("editingDowncast").add((e=>{function t(){o.change((e=>{for(const t of s.values())e.removeClass(n,t),s.delete(t)}))}e.on("insert",t,{priority:"highest"}),e.on("remove",t,{priority:"highest"}),e.on("attribute",t,{priority:"highest"}),e.on("selection",t,{priority:"highest"})}))}export{F as Delete,w as Input,y as InsertTextCommand,K as TextTransformation,G as TextWatcher,z as TwoStepCaretMovement,L as Typing,Z as findAttributeRange,ee as findAttributeRangeBound,$ as getLastTextLine,te as inlineHighlight};