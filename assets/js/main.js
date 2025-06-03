class ViewModel {
  constructor() {
    var self = this;

    self.transmList = TRANSMISSIONS;

    self.transm = ko.observable(self.transmList[0].name);
    self.finalDriveRatio = ko.observable(3.27); // n:1
    self.converterSlip = ko.observable(0); // %
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
        let transm = self.transm();
        if (transm == undefined)
          return [];
        let converterSlip = parseInt(self.converterSlip()) / 100;
        let finalDrive = parseFloat(self.finalDriveRatio());
        let shiftRpm = parseInt(self.shiftRpm()) * (1 - converterSlip);
        let speedUnit = self.chartSpeedUnit();
        let convertSpeed = (rpm, ratio) => _convert(self.calcSpeed(rpm, ratio), "km/h", speedUnit)
        let data = [];
        for (let i = 0; i < transm.gears; i++) {
          let startRpm = i == 0 ? 0 : shiftRpm * (transm.ratios[i] / transm.ratios[i-1]);
          let startSpeed = i == 0 ? 0 : convertSpeed(shiftRpm, transm.ratios[i-1] * finalDrive);
          let endSpeed = convertSpeed(shiftRpm, transm.ratios[i] * finalDrive);
          let lineHue = 360 / transm.gears * i;
          if (i > 0) {
            data.push({
              data: [
                {x: startSpeed, y: shiftRpm },
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
  }
}

ko.applyBindings(new ViewModel());
