/***********************
* Adobe Edge Animate Composition Actions
*
* Edit this file with caution, being careful to preserve 
* function signatures and comments starting with 'Edge' to maintain the 
* ability to interact with these actions from within Adobe Edge Animate
*
***********************/
(function($, Edge, compId){
var Composition = Edge.Composition, Symbol = Edge.Symbol; // aliases for commonly used Edge classes

   //Edge symbol: 'stage'
   (function(symbolName) {
      
      
      

      

      Symbol.bindTimelineAction(compId, symbolName, "Default Timeline", "complete", function(sym, e) {
         
         sym.play(0);

      });
      //Edge binding end

      

      

      Symbol.bindElementAction(compId, symbolName, "document", "compositionReady", function(sym, e) {
         // insert code to be run when the composition is fully loaded here
         
         //makes it fill the viewport on mobile devices
         var meta = document.createElement("meta");
         meta.content = "minimum-scale=1, width=device-width, maximum-scale=1, user-scalable=no";
         meta.name = "viewport";
         document.getElementsByTagName("head")[0].appendChild(meta);
         
         //centres it nicely
         sym.$("#Stage").css({"margin": "auto"})
      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${title1Group}", "touchstart", function(sym, e) {
         serviceRegistry && serviceRegistry.invoke("BaseService", "gotoPage")(1)

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${title1Group}", "click", function(sym, e) {
         serviceRegistry && serviceRegistry.invoke("BaseService", "gotoPage")(1)

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${morninig-glory}", "click", function(sym, e) {
         serviceRegistry && serviceRegistry.invoke("BaseService", "setState")('Prelude Side Bar', "select")

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${morninig-glory}", "touchstart", function(sym, e) {
         serviceRegistry && serviceRegistry.invoke("BaseService", "setState")('Prelude Side Bar', "select")

      });
      //Edge binding end

      Symbol.bindElementAction(compId, symbolName, "${character}", "touchstart", function(sym, e) {
         serviceRegistry && serviceRegistry.invoke("BookService", "takeAvatarPhoto")(function(url) {document.getElementById("Stage_character").style.backgroundImage = "url(" + url + ")";})

      });
      //Edge binding end

   })("stage");
   //Edge symbol end:'stage'

   //=========================================================
   
   //Edge symbol: 'Symbol_leav'
   (function(symbolName) {   
   
   })("Symbol_leaf");
   //Edge symbol end:'Symbol_leaf'

})(window.jQuery || AdobeEdge.$, AdobeEdge, "EDGE-16665010");