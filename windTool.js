var _clubstats;
var _clubs = [];

$(document).ready(function () {
    $('#select-all').on('click', function () {
        $('input[name=club-selected-checkbox]').each(function () {
            $(this).prop('checked', true)
        });
    });
    $('#deselect-all').on('click', function () {
        $('input[name=club-selected-checkbox]').each(function () {
            $(this).prop('checked', false)
        });
    });
});

function generatePDF() {
    var windvalues = [];
    var elevation = $('#windtool-elevation').val();
    var powerball = $('#windtool-powerball').val();
    var windball = $('#windtool-windball').val();
    var windrange = $('#windtool-windrange').val();
    var clubs = [];
    var windballmultiplier;

    $('input[name=club-selected-checkbox]').each(function () {
        if ($(this).prop('checked') == true) {
            var id = $(this).attr('id');
            var clubtype = id.split("-")[0];
            var number = id.split("-")[2];
            //var number = id.substring(id.length - 1);
            var clubname = $('#' + clubtype + '-name-' + number).text();
            var clublevel = $('#' + clubtype + '-level-' + number).val();
            var clubimage = clubtype + '-image-' + number;
            var club = { name: clubname, level: clublevel, clubtype: clubtype, clubimage: clubimage };
            clubs.push(club);
        }
    });

    $.each(clubs, function (index, club) {
        var power;
        var clubtypemaxdistance;
        var accuracy;
        var powerballmultiplier;

        $.each(_clubstats, function (key, clubstat) {
            if (club.name == clubstat.name && club.level == clubstat.level) {
                power = clubstat.power;
                accuracy = clubstat.accuracy;
            }
        });

        switch (club.clubtype) {
            case "drivers":
                clubtypemaxdistance = 240;
                break;
            case "woods":
                clubtypemaxdistance = 180;
                break;
            case "longirons":
                clubtypemaxdistance = 135;
                break;
            case "shortirons":
                clubtypemaxdistance = 90;
                break;
            case "wedges":
                clubtypemaxdistance = 45;
                break;
            case "roughirons":
                clubtypemaxdistance = 135;
                break;
            case "sandwedges":
                clubtypemaxdistance = 120;
                break;

        }

        switch (powerball) {
            case "0":
                powerballmultiplier = 1.0;
                break;
            case "1":
                powerballmultiplier = 1.04;
                break;
            case "2":
                powerballmultiplier = 1.03;
                break;
            case "3":
                powerballmultiplier = 1.04;
                break;
            case "4":
                powerballmultiplier = 1.05;
                break;
            case "5":
                powerballmultiplier = 1.06;
                break;
            case "6":
                powerballmultiplier = 1.07;
                break;
            case "7":
                powerballmultiplier = 1.085;
                break;
            case "8":
                powerballmultiplier = 1.1;
                break;
            case "9":
                powerballmultiplier = 1.115;
                break;
            case "10":
                powerballmultiplier = 1.13;
                break;
        }

        switch (windball) {
            case "0":
                windballmultiplier = 1.0;
                break;
            case "1":
                windballmultiplier = 0.9;
                break;
            case "2":
                windballmultiplier = 0.85;
                break;
            case "3":
                windballmultiplier = 0.8;
                break;
            case "4":
                windballmultiplier = 0.75;
                break;
            case "5":
                windballmultiplier = 0.7;
                break;
            case "6":
                windballmultiplier = 0.65;
                break;
            case "7":
                windballmultiplier = 0.6;
                break;
            case "8":
                windballmultiplier = 0.55;
                break;
            case "9":
                windballmultiplier = 0.5;
                break;
            case "10":
                windballmultiplier = 0.45;
                break;
        }

        var maxWPR = windPerRing(club.name, club.level, accuracy, maxPower(power, clubtypemaxdistance) * powerballmultiplier, club.clubtype)
        var midWPR = windPerRing(club.name, club.level, accuracy, midPower(power, club.clubtype, clubtypemaxdistance) * powerballmultiplier, club.clubtype)
        var minWPR = windPerRing(club.name, club.level, accuracy, minPower(power, club.clubtype, clubtypemaxdistance) * powerballmultiplier, club.clubtype)

        var vals = { club: club.name, level: club.level, min: minWPR, mid: midWPR, max: maxWPR };
        windvalues.push(vals);
    });

    var elevationadjustment = (1 + (elevation / 100))
    var windmovements = [];
    var lowwindrange = 0;
    var highwindrange = 0;

    if (windrange === "none") {
        alert("Please select a wind range");
        return;
    }

    switch (windrange) {
        case "Tour 13":
            lowwindrange = 15;
            highwindrange = 25;
            break;
        case "Pro":
            lowwindrange = 7;
            highwindrange = 10;
            break;
        case "Expert":
            lowwindrange = 11;
            highwindrange = 14;
            break;
        case "Master":
            lowwindrange = 16;
            highwindrange = 19;
            break;
        case "MMM":
            lowwindrange = 0;
            highwindrange = 0;
            break;
    }

    if (lowwindrange == 0 && highwindrange == 0) {
        $.each(windvalues, function (index, windvalue) {
            var minRings = toFixed(windvalue.min, 2);
            var midRings = toFixed(windvalue.mid, 2);
            var maxRings = toFixed(windvalue.max, 2);;
            var vals = { club: windvalue.club, level: windvalue.level, min: minRings, mid: midRings, max: maxRings };
            windmovements.push(vals);
        });
    } else {
        lowwindrange = parseFloat((lowwindrange * windballmultiplier).toFixed(1));
        highwindrange = parseFloat((highwindrange * windballmultiplier).toFixed(1)) + 0.1;
        console.log(`lowwindrange: ${lowwindrange} highwindrange: ${highwindrange}`)
        $.each(windvalues, function (index, windvalue) {
            for (i = lowwindrange; i < highwindrange; i += 0.1) {
                console.log(i)
                var wind = i.toFixed(1);
                var minRings = ((wind * elevationadjustment) / windvalue.min).toFixed(1);
                var midRings = ((wind * elevationadjustment) / windvalue.mid).toFixed(1);
                var maxRings = ((wind * elevationadjustment) / windvalue.max).toFixed(1);
                var vals = { club: windvalue.club, level: windvalue.level, wind: wind, min: minRings, mid: midRings, max: maxRings };
                windmovements.push(vals);
            }
        });
    }
    var doc = new jsPDF()

    if (windrange == "MMM") {

        var powerimage = getBase64Image(document.getElementById("power" + powerball + "-ball"));
        var windimage = getBase64Image(document.getElementById("wind" + windball + "-ball"));

        var startX = 0;
        var startY = doc.internal.pageSize.getWidth() / 3;

        doc.addImage(powerimage, 'PNG', startY + 15, startX + 10, 7, 7);
        doc.addImage(windimage, 'PNG', startY + 30, startX + 10, 7, 7);

        var i, j, temparray, chunk = 30;
        var xoffset = 5;

        for (i = 0, j = windmovements.length; i < j; i += chunk) {
            temparray = windmovements.slice(i, i + chunk);
            doc.autoTable({
                startY: 25,
                margin: { top: 20, left: xoffset },
                head: headRowsMMM(),
                body: temparray,
                theme: 'striped',
                styles: {
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 15 },
                    2: { cellWidth: 10 },
                    3: { cellWidth: 10 },
                    4: { cellWidth: 10 }
                },
                rowStyles: {
                    0: { rowHeight: 7 },
                    1: { rowHeight: 7 },
                    2: { rowHeight: 7 },
                    3: { rowHeight: 7 },
                    4: { rowHeight: 7 }
                },
                allSectionHooks: true,
                didParseCell: function (data) {
                    if (data.row.section === 'body' && data.column.dataKey === 'min') {
                        doc.setTextColor(255, 255, 255)
                        data.cell.styles.fillColor = [211, 211, 211]
                    }
                    if (data.row.section === 'body' && data.column.dataKey === 'mid') {
                        doc.setTextColor(255, 255, 255)
                        data.cell.styles.fillColor = [52, 204, 255]
                    }
                    if (data.row.section === 'body' && data.column.dataKey === 'max') {
                        doc.setTextColor(255, 255, 255)
                        data.cell.styles.fillColor = [231, 76, 60]
                    }
                },
                willDrawCell: function (data) {
                    if (data.row.section === 'body' && (data.column.dataKey === 'min' || data.column.dataKey === 'mid' || data.column.dataKey === 'max')) {
                        doc.setTextColor(255, 255, 255)
                        doc.setFontStyle('bold')
                    }
                }
            });
            if (i == 0) {
                doc.text("Elevation " + elevation + "%", 10, doc.autoTable.previous.finalY + 30)
            }

            xoffset += 50;
        }
    } else {
        $.each(clubs, function (index, club) {
            var clubadjustments = windmovements.filter(function (windmovement) {
                return windmovement.club === club.name;
            });

            var clubimage = getBase64Image(document.getElementById(club.clubimage));
            var powerimage = getBase64Image(document.getElementById("power" + powerball + "-ball"));
            var windimage = getBase64Image(document.getElementById("wind" + windball + "-ball"));

            if (index > 0) {
                doc.addPage();
                doc.setPage(doc.pageNumber + 1)
            }

            var startX = 0;
            var startY = doc.internal.pageSize.getWidth() / 3;

            doc.text(club.name, 10, 15);
            doc.addImage(clubimage, 'PNG', startY - 10, startX, 20, 20);
            doc.addImage(powerimage, 'PNG', startY + 15, startX + 10, 7, 7);
            doc.addImage(windimage, 'PNG', startY + 30, startX + 10, 7, 7);

            var i, j, temparray, chunk = 30;
            var xoffset = 5;

            for (i = 0, j = clubadjustments.length; i < j; i += chunk) {
                temparray = clubadjustments.slice(i, i + chunk);
                doc.autoTable({
                    startY: 25,
                    margin: { top: 20, left: xoffset },
                    head: headRows(),
                    body: temparray,
                    theme: 'striped',
                    styles: {
                        halign: 'center'
                    },
                    columnStyles: {
                        0: { cellWidth: 12 },
                        1: { cellWidth: 10 },
                        2: { cellWidth: 10 },
                        3: { cellWidth: 10 }
                    },
                    rowStyles: {
                        0: { rowHeight: 7 },
                        1: { rowHeight: 7 },
                        2: { rowHeight: 7 },
                        3: { rowHeight: 7 }
                    },
                    allSectionHooks: true,
                    pageNumber: index,
                    didParseCell: function (data) {
                        if (data.row.section === 'body' && data.column.dataKey === 'min') {
                            doc.setTextColor(255, 255, 255)
                            data.cell.styles.fillColor = [211, 211, 211]
                        }
                        if (data.row.section === 'body' && data.column.dataKey === 'mid') {
                            doc.setTextColor(255, 255, 255)
                            data.cell.styles.fillColor = [52, 204, 255]
                        }
                        if (data.row.section === 'body' && data.column.dataKey === 'max') {
                            doc.setTextColor(255, 255, 255)
                            data.cell.styles.fillColor = [231, 76, 60]
                        }
                    },
                    willDrawCell: function (data) {
                        if (data.row.section === 'body' && (data.column.dataKey === 'min' || data.column.dataKey === 'mid' || data.column.dataKey === 'max')) {
                            doc.setTextColor(255, 255, 255)
                            doc.setFontStyle('bold')
                        }
                    }
                });
                if (i == 0) {
                    doc.text("Elevation " + elevation + "%", 10, doc.autoTable.previous.finalY + 30)
                }
                xoffset += 50;
            }
        });
    }

    window.open(doc.output('bloburl', { filename: 'windchart.pdf' }));
}

function loadClubs() {
    clubTypes = ["drivers", "woods", "longirons", "shortirons", "wedges", "roughirons", "sandwedges"];
    $.each(clubTypes, function (index, clubType) {
        $.getJSON('data/clubs/' + clubType + '.json', function (json) {
            clubs = json;
            presentClubs(clubs, clubType);
            return;
        }).fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.log("Request Failed: " + err)
        });
    });

    $.getJSON('data/clubstats.json', function (json) {
        _clubstats = json;
        return;
    }).fail(function (jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log("Request Failed: " + err)
    });
}

function presentClubs(clubs, clubType) {
    $('#clubs-' + clubType).empty();
    $.each(clubs, function (index, club) {
        _clubs.push(club);
        var clubHtml = '<div class="col-md-4 col-lg-3">\
        <article class="product product-xs">\
          <header class="product-header">\
              <div class="product-figure"><img id="' + clubType + '-image-' + index + '" class="fillheight" src="images/clubs/' + club.image + '.png" alt=""/></div>\
          </header>\
          <footer class="product-content">\
              <div class="product-title" id="' + clubType + '-name-' + index + '"><strong>' + club.name + '</strong></div>\
              <div class="product-price"><span class="heading-6 product-price-new">Level\
                <ul class="list-inline list-inline-md list-inline-middle pd-bt-20">\
                    <li>\
                      <select id="' + clubType + '-level-' + index + '" class="select select-minimal" data-placeholder="Select Goldenshot" data-dropdown-class="select-minimal-dropdown" style="min-width: 50px">';

        var maxLevel;
        switch (club.type) {
            case "Common":
                maxLevel = 10;
                break;
            case "Rare":
                maxLevel = 9;
                break;
            case "Epic":
                maxLevel = 8;
                break;
            default:
                maxLevel = 1;
        }

        var i;
        for (i = 1; i <= maxLevel; i++) {
            clubHtml += '<option value="' + i + '">' + i + '</option>';
        }

        clubHtml += '</select>\
                      </li>\
                  </ul>\
                  </span>\
                  <div>Selected: <input id="' + clubType + '-selected-' + index + '" name="club-selected-checkbox" value="1" type="checkbox" class="checkbox-custom" /></div>\
                </div>\
            </footer>\
          </article>\
      </div>'

        $('#clubs-' + clubType).append(clubHtml);
    });
}

function windPerRing(name, level, accuracy, power, clubtype) {
    var windcategorymultiplier = categoryMultiplier(clubtype);
    var windPerRing = ((3 - (accuracy * 0.02)) * windcategorymultiplier) / power;
    if ((name == "The B52" || name == "The Grizzly") && level >= 5) {
        windPerRing = windPerRing * 0.9;
    }
    return windPerRing
}

function maxPower(power, clubtypemaxdistance) {
    return power / clubtypemaxdistance;
}

function minPower(power, clubtype, clubtypemaxdistance) {
    switch (clubtype) {
        case "drivers":
            return 0.75;
        case "woods":
            return 0.75;
        case "longirons":
            return 0.66;
        case "shortirons":
            return 0.5;
        case "wedges":
        case "roughirons":
        case "sandwedges":
            return maxPower(power, clubtypemaxdistance) / 4.0;
    }
}

function midPower(power, clubtype, clubtypemaxdistance) {
    switch (clubtype) {
        case "drivers":
        case "woods":
        case "longirons":
        case "shortirons":
            return averagePower(power, clubtype, clubtypemaxdistance);
        case "wedges":
        case "roughirons":
        case "sandwedges":
            return (maxPower(power, clubtypemaxdistance) / 2.0);
    }
}

function averagePower(power, clubtype, clubtypemaxdistance) {
    return (minPower(power, clubtype, clubtypemaxdistance) + maxPower(power, clubtypemaxdistance)) / 2.0;
}

function categoryMultiplier(clubtype) {
    switch (clubtype) {
        case "roughirons":
            return 1.45;
        case "sandwedges":
            return 1.15;
        default:
            return 1;
    }
}

function headRows() {
    return [
        { wind: 'Wind', min: 'Min', mid: 'Mid', max: 'Max' },
    ]
}

function headRowsMMM() {
    return [
        { club: "Club", level: "Level", min: 'Min', mid: 'Mid', max: 'Max' },
    ]
}

function columns() {
    return [
        { header: 'Wind', dataKey: 'wind' },
        { header: 'Min', dataKey: 'min' },
        { header: 'Mid', dataKey: 'mid' },
        { header: 'Max', dataKey: 'max' }
    ]
}

function columnsMMM() {
    return [
        { header: 'Club', dataKey: 'club' },
        { header: 'Level', dataKey: 'level' },
        { header: 'Min', dataKey: 'min' },
        { header: 'Mid', dataKey: 'mid' },
        { header: 'Max', dataKey: 'max' }
    ]
}

function getBase64Image(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    var dataURL = canvas.toDataURL("image/png");
    return dataURL;
}

function toFixed(num, precision) {
    return (+(Math.round(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision);
}