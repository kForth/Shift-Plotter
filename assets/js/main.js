class ViewModel {
  constructor() {
    var self = this;

    self.transmList = [
      {
        title: "Select Transmission"
      },
      ...TRANSMISSIONS
    ];
    self.selectedTransm = ko.observable(self.transmList[0]);
    self.selectedTransm.subscribe(() => {
      let transm = self.selectedTransm();
      if (transm == self.transmList[0])
        return;
      for (let i = 0; i < transm.gears; i++) {
        if (i < self.gearRatios().length)
          self.gearRatios()[i].ratio(transm.ratios[i]);
        else {
          self._insertGearRow(
            self._newGearRatioPoint(transm.ratios[i], 0)
          );
        }
      }
      self.selectedTransm(self.transmList[0]);
      if (self.gearRatios().length > transm.gears)
        self.gearRatios.splice(transm.gears-1, self.gearRatios().length - transm.gears)
    });

    self.gearRatios = ko.observableArray(self.transmList[1].ratios.map(
      e => ({ratio: ko.observable(e), slip: ko.observable(0)})
    ));
    self.finalDriveRatio = ko.observable(3.27); // n:1
    self.shiftRpm = ko.observable(6000); // RPM
    self.tireDiameterRaw = ko.observable(27.9);
    self.tireDiameterUnit = ko.observable("in");
    self.chartSpeedUnit = ko.observable("km/h");

    self.tireCircumerence_km = ko.computed(() => _convert(
      self.tireDiameterRaw(), self.tireDiameterUnit(), "km"
    ) * Math.PI); // km

    self.calcSpeed = function (rpm, ratio) {
      return rpm * 60 / ratio * self.tireCircumerence_km();
    };


    // Shift Points Data
    self.shiftPointsChart = {
      type: 'scatter',
      data: ko.computed(() => {
        let ratios = self.gearRatios();
        let nGears = ratios.length;
        if (!nGears) return [];
        let shiftRpm = parseInt(self.shiftRpm());
        let finalDrive = parseFloat(self.finalDriveRatio());
        let convertSpeed = (rpm, ratio, slip) => _convert(self.calcSpeed(rpm * (1 - slip), ratio), "km/h", self.chartSpeedUnit())
        let data = [];
        let lastRatio = 0;
        let lastSpeed = 0;
        let lastSlip = 0;
        for (let i = 0; i < nGears; i++) {
          let ratio = parseFloat(ratios[i].ratio());
          let slip = parseInt(ratios[i].slip()) / 100;
          let startRpm = i == 0 ? 0 : shiftRpm * (ratio / lastRatio);
          let startSpeed = i == 0 ? 0 : convertSpeed(shiftRpm, lastRatio * finalDrive, lastSlip);
          let endSpeed = convertSpeed(shiftRpm, ratio * finalDrive, slip);
          let lineHue = 360 / nGears * i;
          if (i > 0) {
            data.push({
              data: [
                {x: lastSpeed, y: shiftRpm },
                {x: startSpeed, y: startRpm },
              ],
              backgroundColor: 'rgb(80, 80, 80)',
              borderColor: 'rgb(60, 60, 60)',
              borderDash: [5, 5],
              showLine: true,
              pointRadius: 0,
              pointHitRadius: 0,
              order: 1,
            })
          }
          data.push({
            label: `${i + 1}${ORDINAL_SUFFIXES[i+1] || "th"}`,
            data: [
              { x: startSpeed, y: startRpm },
              { x: endSpeed, y: shiftRpm},
            ],
            backgroundColor: `hsl(${lineHue}, 100%, 70%)`,
            borderColor: `hsl(${lineHue}, 90%, 60%)`,
            showLine: true,
            showMarker: false,
          })
          lastRatio = ratio;
          lastSpeed = endSpeed;
          lastSlip = slip;
        }
        return {
          datasets: data
        };
      }),
      options: {
        observeChanges: true,
        scales: {
          x: { min: 0, startAtZero: true, title: { display: true, text: `Speed (${self.chartSpeedUnit()})` } },
          y: { min: 0, max: () => parseInt(self.shiftRpm()) + 500, startAtZero: true, title: { display: true, text: 'RPM' } },
        },
        plugins: {
          legend: {
            labels: {
              filter: item => item.text !== undefined && item.text.length > 0,
            }
          }
        }
      }
    };

    // Gear Ratio Table Helpers
    self._newGearRatioPoint = function (ratio, slip) {
      return {
        ratio: ko.observable(ratio),
        slip: ko.observable(slip),
      };
    };
    self._getGearRatioMidpoint = function (a, b) {
      return self._newGearRatioPoint(
        ((a.ratio() + b.ratio()) / 2).toFixed(2),
        ((a.slip() + b.slip()) / 2).toFixed(0)
      );
    };
    self._insertGearRow = function (pt, index) {
      if (index === undefined)
        self.gearRatios.push(pt);
      else
        self.gearRatios.splice(index, 0, pt);
    };
    self.addGearRow = function () {
      let lastPt = self.gearRatios().at(-1);
      let pt = self._newGearRatioPoint(
        lastPt.ratio(),
        lastPt.slip()
      );
      self._insertGearRow(pt);
    };
    self.removeGearRow = function (row) {
      self.gearRatios.remove(row);
    };
    self.moveGearRowUp = function (row) {
      let index = self.gearRatios.indexOf(row);
      self.gearRatios.remove(row);
      self.gearRatios.splice(index - 1, 0, row);
    };
    self.moveGearRowDown = function (row) {
      let index = self.gearRatios.indexOf(row);
      self.gearRatios.remove(row);
      self.gearRatios.splice(index + 1, 0, row);
    };
    self.insertGearRowAbove = function (row) {
      let index = self.gearRatios.indexOf(row);
      let pt = (index > 0) ?
        self._getGearRatioMidpoint(self.gearRatios().at(index - 1), row) :
        self._newGearRatioPoint(row.ratio(), row.slip());
      self._insertGearRow(pt, index);
    };
    self.insertGearRowBelow = function (row) {
      let index = self.gearRatios.indexOf(row);
      let pt = (index < self.gearRatios.length - 1) ?
        self._getGearRatioMidpoint(row, self.gearRatios().at(index + 1)) :
        self._newGearRatioPoint(row.ratio(), row.slip());
      self._insertGearRow(pt, index + 1);
    };
  }
}

ko.applyBindings(new ViewModel());
