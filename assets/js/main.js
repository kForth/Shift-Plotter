function _convert(v, from, to){
    return math.unit(parseFloat(v), from).toNumber(to);
}
function _foreach(arr, fn) {
    return ko.utils.arrayMap(arr, fn)
}

class ViewModel {
  constructor() {
    var self = this;

    self.transmList = TRANSMISSIONS;

    self.transm = ko.observable(self.transmList[0].name);
    self.finalDriveRatio = ko.observable(3.27); // n:1
    self.shiftRpm = ko.observable(6000); // RPM
    self.converterSlip = ko.observable(0); // %

    self.tireDiameterRaw = ko.observable(27.9);
    self.tireDiameterUnit = ko.observable("in");
    self.tireCircumerence_km = ko.computed(() => _convert(
      self.tireDiameterRaw(), self.tireDiameterUnit(), "km"
    ) * Math.PI); // km
    self.speedUnit = ko.observable("km/h");

    self.calcSpeed = function (rpm, ratio) {
      return rpm * 60 / ratio / self.finalDriveRatio() * self.tireCircumerence_km();
    };

    // Shift Points Data
    self.shiftPointsChart = {
      type: 'scatter',
      data: ko.computed(() => {
        let transm = self.transm();
        if (transm == undefined)
          return [];
        let shiftRpm = self.shiftRpm();
        let data = [{
          label: "Gear 1",
          data: [
            { x: 0, y: 0 },
            { x: self.calcSpeed(shiftRpm, transm.ratios[0]), y: shiftRpm},
          ],
          showLine: true,
        }];
        for (let i = 1; i < transm.gears; i++) {
          data.push({
            label: `Gear ${i}`,
            data: [
              { x: self.calcSpeed(shiftRpm, transm.ratios[i-1]), y: shiftRpm * (transm.ratios[i] / transm.ratios[i-1]) },
              { x: self.calcSpeed(shiftRpm, transm.ratios[i]), y: shiftRpm},
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
          y: { min: 0, max: () => self.shiftRpm() + 500, startAtZero: true, title: { display: true, text: 'RPM' } },
        }
      }
    };

    // Subscriptions
    self.transm.subscribe(() => self.updateChart());
    self.tireDiameterRaw.subscribe(() => self.updateChart());
    self.tireDiameterUnit.subscribe(() => self.updateChart());
    self.finalDriveRatio.subscribe(() => self.updateChart());
    self.converterSlip.subscribe(() => self.updateChart());
    self.shiftRpm.subscribe(() => self.updateChart());

    // Main Update Function
    self.updateChart = function () {
      // TODO
    };


    self.generatePoints = function () {
      let pts = [];

      // TODO:

      return pts;
    };
  }
}

ko.applyBindings(new ViewModel());
