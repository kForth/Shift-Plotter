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
    self.speedUnit = ko.observable("km/h");

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
        let shiftRpm = parseInt(self.shiftRpm());
        let finalDrive = parseFloat(self.finalDriveRatio());
        let converterSlip = parseInt(self.converterSlip()) / 100;
        let data = [{
          label: "Gear 1",
          data: [
            { x: 0, y: 0 },
            { x: self.calcSpeed(shiftRpm * (1 - converterSlip), transm.ratios[0] * finalDrive), y: shiftRpm},
          ],
          showLine: true,
        }];
        for (let i = 1; i < transm.gears; i++) {
          data.push({
            label: `Gear ${i + 1}`,
            data: [
              { x: self.calcSpeed(shiftRpm, transm.ratios[i-1] * finalDrive), y: shiftRpm * (transm.ratios[i] / transm.ratios[i-1]) },
              { x: self.calcSpeed(shiftRpm, transm.ratios[i] * finalDrive), y: shiftRpm},
            ],
            showLine: true,
          })
        }
        return {
          datasets: data
        };
      }),
      options: {
        observeChanges: true,
        scales: {
          x: { min: 0, startAtZero: true, title: { display: true, text: 'Speed' } },
          y: { min: 0, max: () => parseInt(self.shiftRpm()) + 500, startAtZero: true, title: { display: true, text: 'RPM' } },
        }
      }
    };
  }
}

ko.applyBindings(new ViewModel());
