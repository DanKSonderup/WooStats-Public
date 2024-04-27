
/** Sets the select option to selected value upon reload */
window.addEventListener('load', function () {
    const currentUrl = window.location.href;
    const selectElement = document.getElementById("dataperiod");
    const selectedValue = currentUrl.substring(currentUrl.length - 2);

    for (let option of selectElement.options) {
        if (option.value === selectedValue) {
            option.selected = true;
            break;
        }
    }
});


function sortTable(n, isNum) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementsByClassName("fl-table")[0];
    switching = true;
    //Set the sorting direction to ascending:
    dir = "asc";
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.getElementsByTagName("TR");
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 1; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[n].innerHTML;
            y = rows[i + 1].getElementsByTagName("TD")[n].innerHTML;
            if (isNum) {
                x = parseFloat(x) || 0;
                y = parseFloat(y) || 0;
            } else {
                if (x.includes('%')) {
                    x = parseInt(x.replace("%", ""), 10) || 0;
                    y = parseInt(y.replace("%", ""), 10) || 0;
                } else {
                    x = x.toLowerCase();
                    y = y.toLowerCase();
                }
            }
            /*check if the two rows should switch place,
            based on the direction, asc or desc:*/
            shouldSwitch = ((dir == "asc") && (x > y)) || (dir == "desc" && (x < y))
            if (shouldSwitch) {
                /*If a switch has been marked, make the switch
                and mark that a switch has been done:*/
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
                //Each time a switch is done, increase this count by 1:
                switchcount++;
            } else {
                /*If no switching has been done AND the direction is "asc",
                set the direction to "desc" and run the while loop again.*/
                if (switchcount === 0 && dir === "asc") {
                    if (dir === "asc") {
                        dir = "desc";
                    } else {
                        dir = "asc";
                    }
                    // Reset switchcount for the next iteration
                    switchcount = 1;
                }
            }
        }
    }
}