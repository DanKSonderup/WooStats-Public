

function markAllCB() {
    let allCbs = document.querySelectorAll('input[type=checkbox]');
    for (element of allCbs) {
        if (element.checked) {
            element.checked = false;
        } else {
            element.checked = true;
        }
    }
}


document.getElementById("profitmarginform").addEventListener("submit", function (event) {
    event.preventDefault();

    const array = getProductIdsforUpdate();
    if (array.length == 0) {
        window.alert("Du har ikke valgt nogen produkter");
        return;
    }

    const initialValue = {};
    const customData = array.reduce((accumulator, currentValue, index) => {
        accumulator['key' + index] = currentValue;
        return accumulator;
    }, initialValue);

    // Custom data as hidden input fields
    for (const key in customData) {
        if (customData.hasOwnProperty(key)) {
            var input = document.createElement("input");
            input.setAttribute("type", "hidden");
            input.setAttribute("name", key);
            input.setAttribute("value", customData[key]);
            this.appendChild(input);
        }
    }

    this.submit();
});

function getProductIdsforUpdate() {
    let products = [];
    let rows = document.getElementsByTagName("tr");

    for (tableRow of rows) {
        let tds = tableRow.getElementsByTagName("td");
        if (tds.length >= 6) { // Check if tds[1] exists
            let productId = tds[1];
            let cbCheck = tds[7].querySelectorAll('input[type=checkbox]');
            if (cbCheck[0].checked) {
                productId = productId.innerText;
                products.push(productId);
            }
        }
    }

    return products;
}



function sortTable(n, isNum) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementsByClassName("fl-table")[0];
    switching = true;
    dir = "asc";

    while (switching) {
        switching = false;
        rows = table.getElementsByTagName("TR");
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;

            x = rows[i].getElementsByTagName("TD")[n].innerHTML;
            y = rows[i + 1].getElementsByTagName("TD")[n].innerHTML;
            if (isNum) {
                if (x.includes(".")) {
                    x = parseFloat(x);
                } else {
                    x = parseInt(x);
                }
                if (y.includes(".")) {
                    y = parseFloat(y);
                } else {
                    y = parseInt(y);
                }
            } else {

                x = x.toLowerCase();
                y = y.toLowerCase();
            }

            shouldSwitch = ((dir == "asc") && (x > y)) || (dir == "desc" && (x < y))

            if (shouldSwitch) {
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
                switchcount++;
            } else {
                if (switchcount == 0 && dir == "asc") {
                    dir = "desc";
                    switching = true;
                }
            }
        }
    }
}