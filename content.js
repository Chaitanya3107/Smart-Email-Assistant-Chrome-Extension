// Log a message indicating that the content script of the email writer extension has been loaded.
console.log("Email Writer Extension - Content Script Loader");

// This function is intended to inject a button into the compose window. It's currently empty.
function injectButton(){
    // Code for injecting the button would go here (e.g., create a button element and append it to the DOM)
}

// MutationObserver is a browser API that watches for changes (mutations) in the DOM.
const observer = new MutationObserver((mutations) => {  // 'mutations' is an array of mutation records
    // Iterate over all mutations detected.
    for(const mutation of mutations){
        // 'addedNodes' is a list of nodes that have been added to the DOM as part of the mutation
        const addedNodes = Array.from(mutation.addedNodes); 
        
        // Check if any of the added nodes is an element (Node.ELEMENT_NODE) and if it matches specific selectors.
        // We're checking if the added node is the compose window or something that looks like it.
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&  // Check if the node is an element (not text or comment)
            (node.matches('.aDh, .btc, [role="dialog"]') ||  // Check if it matches any of the given CSS selectors
            node.querySelector('.aDh, .btc, [role="dialog"]'))  // Or if one of its child elements matches
        );
        
        // If a compose window is detected, log it.
        if(hasComposeElements){
            console.log("Compose Window Detected");
            
            // After a slight delay (500ms), attempt to inject the button into the compose window.
            setTimeout(injectButton, 500);
        }
    }
});

// The MutationObserver is now observing the document body for added nodes.
observer.observe(document.body,{
    childList: true,  // Watch for changes to child elements (added/removed nodes)
    subtree: true     // Watch for changes in all descendants, not just direct children
});
