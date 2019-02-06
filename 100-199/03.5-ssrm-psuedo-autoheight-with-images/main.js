function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this, args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

let nodesToSettle = [];

let imgSettler = debounce(
  () => {
    console.log(`images are settled now`, nodesToSettle)
    console.log(`redrawing rows`);

    // none of the following cause getRowHeight to be reinvoked 

    // gridOptions.api.onRowHeightChanged();

    // gridOptions.api.refreshCells({
    //   rowNodes: nodesToSettle,
    //   force: true
    // });

    // gridOptions.api.redrawRows({
    //   rowNodes: nodesToSettle,
    //   force: true
    // });

    // nodesToSettle.forEach(node => node.setRowHeight(null))
    // setTimeout(() => gridOptions.api.onRowHeightChanged(), 0);

    gridOptions.api.resetRowHeights();

    nodesToSettle = [];
  },
  500
);

let imgLoadedListener = (node, imgHeight) => {
  console.log(`image settled for: `, node.id, imgHeight)
  node.data.rowHeight = imgHeight;
  nodesToSettle.push(node)
  imgSettler();
};

var columnDefs = [
  { field: 'id' },
  {
    field: 'richText',
    width: 500,
    cellRenderer: 'richTextRenderer',
    cellRendererParams: {
      onImageLoaded: imgLoadedListener
    }
  },
  { field: 'athlete' },
  { field: 'age' },
  { field: 'country' },
  { field: 'year' },
  { field: 'sport' },
  { field: 'gold' },
  { field: 'silver' },
  { field: 'bronze' }
];

var gridOptions = {
  defaultColDef: {
    width: 120,
    resizable: true
  },
  columnDefs: columnDefs,
  rowModelType: 'serverSide',
  cacheBlockSize: 100,
  animateRows: true,
  components: {
    richTextRenderer: RichTextRenderer,
  },
  getRowHeight: (params) => {
    let rowHeight = params.data.rowHeight ? params.data.rowHeight : 25;
    console.log(`height for rowNode`, params.node.id, params.data.rowHeight, rowHeight)
    return rowHeight;
  }
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {

  var gridDiv = document.querySelector('#myGrid');
  new agGrid.Grid(gridDiv, gridOptions);

  agGrid.simpleHttpRequest({ url: 'https://raw.githubusercontent.com/ag-grid/ag-grid/master/packages/ag-grid-docs/src/olympicWinners.json' }).then(function (data) {
    // add id to data
    var idSequence = 0;
    data.forEach(function (item) {
      item.id = idSequence++;
      item.imageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
    });

    var server = new FakeServer(data);
    var datasource = new ServerSideDatasource(server);
    gridOptions.api.setServerSideDatasource(datasource);
  });
});

function ServerSideDatasource(server) {
  return {
    getRows(params) {
      // adding delay to simulate real sever call
      setTimeout(function () {

        var response = server.getResponse(params.request);

        if (response.success) {
          // call the success callback
          params.successCallback(response.rows, response.lastRow);
        } else {
          // inform the grid request failed
          params.failCallback();
        }

      }, 500);
    }
  };
}

function FakeServer(allData) {
  return {
    getResponse(request) {
      console.log('asking for rows: ' + request.startRow + ' to ' + request.endRow);

      // take a slice of the total rows
      var rowsThisPage = allData.slice(request.startRow, request.endRow);

      // if on or after the last page, work out the last row.
      var lastRow = allData.length <= request.endRow ? data.length : -1;

      return {
        success: true,
        rows: rowsThisPage,
        lastRow: lastRow
      };
    }
  };
}
const imageUrls = [
  "https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  "https://images.pexels.com/photos/326875/pexels-photo-326875.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  "https://www.catster.com/wp-content/uploads/2012/11/Ginger-cat-drinking-water-out-of-a-small-bowl.jpg",
  "data:image/jpeg;base64,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"
];