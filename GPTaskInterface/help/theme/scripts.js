function startPage() {
    var page = getURLParameter('page');
    if (page == null || page == "") {
        page='home.html';
    }
    goto(page);
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
}

function goto(aPage) {
    var baseUrl = "./";
    var fullPageUrl = baseUrl + aPage;
    document.getElementById("ifcontents").src = fullPageUrl;
}