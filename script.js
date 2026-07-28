/*
 * Interactive slideshow narrative visualization
 * Dataset: cars2017.csv
 * Library: D3.js v7 only
 */

const state = {
  scene: 0,
  activeFuel: "All",
  data: []
};

const palette = {
  Gasoline: "#102d58",
  Diesel: "#2f6f73",
  Electricity: "#c69b45"
};

const sceneDefinitions = [
  {
    kicker: "Scene 1 · Overview",
    title: "What makes a car efficient?",
    description:
      "For gasoline and diesel vehicles, engine size is a strong starting point. An important relationship to note is as cylinder count increases, average highway efficiency generally decreases.",
    hint: "Hint: Hover over a point to know the details of the manufacturer. Use the fuel buttons to isolate gasoline or diesel vehicles.",
    chartKicker: "Engine size",
    chartTitle: "More cylinders are associated with lower highway MPG",
    progressLabel: "Overview",
    nextLabel: "Next: City vs. Highway"
  },
  {
    kicker: "Scene 2 · The road matters",
    title: "Efficiency changes between city and highway driving.",
    description:
      "Most combustion vehicles travel farther per gallon on the highway than in the city. The distance above the diagonal line shows the size of that advantage.",
    hint: "Hint: Hover over a point to compare its city and highway ratings. Filter by fuel to see whether the pattern persists.",
    chartKicker: "Driving conditions",
    chartTitle: "Highway MPG usually exceeds city MPG",
    progressLabel: "City vs. Highway",
    nextLabel: "Next: Beyond Gasoline"
  },
  {
    kicker: "Scene 3 · Beyond gasoline",
    title: "Fuel type changes the scale of efficiency.",
    description:
      "Diesel generally improves the average MPG, however electric vehicles occupy a different range entirely. Electric vehicles are reported as MPGe, an energy-equivalent measure.",
    hint: "Hint: Hover over any bar for the exact category average. Select a fuel button to emphasize one group.",
    chartKicker: "Fuel comparison",
    chartTitle: "Average city and highway efficiency by fuel type",
    progressLabel: "Beyond Gasoline",
    nextLabel: "Restart Story"
  }
];

const tooltip = d3.select("#tooltip");
const chartContainer = d3.select("#chart");

const formatOneDecimal = d3.format(".1f");
const formatInteger = d3.format("d");

function parseCar(row) {
  return {
    Make: row.Make,
    Fuel: row.Fuel,
    EngineCylinders: +row.EngineCylinders,
    AverageHighwayMPG: +row.AverageHighwayMPG,
    AverageCityMPG: +row.AverageCityMPG
  };
}

function initializeInterface() {
  d3.select(".brand").on("click", (event) => {
    event.preventDefault();
    setScene(0);
  });

  d3.selectAll(".scene-tab").on("click", function () {
    setScene(+this.dataset.scene);
  });

  d3.select("#previous-button").on("click", () => {
    if (state.scene > 0) setScene(state.scene - 1);
  });

  d3.select("#next-button").on("click", () => {
    if (state.scene < sceneDefinitions.length - 1) {
      setScene(state.scene + 1);
    } else {
      setScene(0);
    }
  });

  d3.select("body").on("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (state.scene < sceneDefinitions.length - 1) setScene(state.scene + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (state.scene > 0) setScene(state.scene - 1);
    }
  });

  buildProgress();
}

function buildProgress() {
  const progress = d3
    .select("#progress")
    .selectAll("button")
    .data(sceneDefinitions)
    .join("button")
    .attr("type", "button")
    .attr("class", "progress-step")
    .attr("aria-label", (d, i) => `Go to scene ${i + 1}: ${d.progressLabel}`)
    .on("click", (event, d) => setScene(sceneDefinitions.indexOf(d)));

  progress
    .append("span")
    .attr("class", "progress-number")
    .text((d, i) => i + 1);

  progress
    .append("span")
    .attr("class", "progress-label")
    .text((d) => d.progressLabel);
}

function setScene(sceneIndex) {
  state.scene = Math.max(0, Math.min(sceneDefinitions.length - 1, sceneIndex));
  state.activeFuel = "All";
  hideTooltip();
  renderScene();
}

function renderScene() {
  const scene = sceneDefinitions[state.scene];

  d3.select("#scene-kicker").text(scene.kicker);
  d3.select("#scene-title").text(scene.title);
  d3.select("#scene-description").text(scene.description);
  d3.select("#interaction-hint").text(scene.hint);
  d3.select("#chart-kicker").text(scene.chartKicker);
  d3.select("#chart-title").text(scene.chartTitle);
  d3.select("#current-scene").text(String(state.scene + 1).padStart(2, "0"));

  d3.selectAll(".scene-tab")
    .classed("active", function () {
      return +this.dataset.scene === state.scene;
    })
    .attr("aria-current", function () {
      return +this.dataset.scene === state.scene ? "step" : null;
    });

  d3.selectAll(".progress-step")
    .classed("active", (d, i) => i === state.scene)
    .classed("completed", (d, i) => i < state.scene)
    .attr("aria-current", (d, i) => (i === state.scene ? "step" : null));

  d3.select("#previous-button").property("disabled", state.scene === 0);
  d3.select("#next-button").text(scene.nextLabel + " →");

  chartContainer.selectAll("*").remove();

  if (state.scene === 0) drawEngineScene();
  if (state.scene === 1) drawCityHighwayScene();
  if (state.scene === 2) drawFuelScene();
}

function chartFrame({ xDomain, yDomain, xLabel, yLabel, xTicks, yTicks }) {
  const width = 860;
  const height = 510;
  const margin = { top: 28, right: 32, bottom: 68, left: 70 };

  const svg = chartContainer
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img");

  const x = d3
    .scaleLinear()
    .domain(xDomain)
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain(yDomain)
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3
        .axisLeft(y)
        .ticks(yTicks || 7)
        .tickSize(-(width - margin.left - margin.right))
        .tickFormat("")
    );

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(xTicks || 7).tickSizeOuter(0));

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(yTicks || 7).tickSizeOuter(0));

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", height - 17)
    .attr("text-anchor", "middle")
    .text(xLabel);

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + height - margin.bottom) / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .text(yLabel);

  return { svg, x, y, width, height, margin };
}

function drawEngineScene() {
  const data = state.data.filter((d) => d.EngineCylinders > 0);
  const fuels = ["All", "Gasoline", "Diesel"];
  buildFuelControls(fuels);

  const { svg, x, y } = chartFrame({
    xDomain: [1.5, 12.5],
    yDomain: [14, 44],
    xLabel: "Engine cylinders",
    yLabel: "Average highway MPG",
    xTicks: 6,
    yTicks: 6
  });

  svg.append("title").text("Scatterplot of engine cylinders and average highway miles per gallon.");

  const regression = linearRegression(
    data.map((d) => d.EngineCylinders),
    data.map((d) => d.AverageHighwayMPG)
  );

  const trendData = [2, 12].map((cylinders) => ({
    x: cylinders,
    y: regression.intercept + regression.slope * cylinders
  }));

  svg
    .append("path")
    .datum(trendData)
    .attr("fill", "none")
    .attr("stroke", "#9a9387")
    .attr("stroke-width", 1.6)
    .attr("stroke-dasharray", "6 5")
    .attr("d", d3.line().x((d) => x(d.x)).y((d) => y(d.y)));

  svg
    .append("text")
    .attr("class", "trend-label")
    .attr("x", x(10.2))
    .attr("y", y(regression.intercept + regression.slope * 10.2) - 10)
    .text("overall trend");

  svg
    .append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("class", "data-point")
    .attr("cx", (d) => x(d.EngineCylinders))
    .attr("cy", (d) => y(d.AverageHighwayMPG))
    .attr("r", 5.1)
    .attr("fill", (d) => palette[d.Fuel])
    .attr("opacity", (d) => pointOpacity(d.Fuel))
    .on("mouseenter", (event, d) => {
      showTooltip(
        event,
        `<strong>${escapeHtml(d.Make)}</strong>
         <span class="tooltip-accent">${escapeHtml(d.Fuel)}</span><br>
         ${formatInteger(d.EngineCylinders)} cylinders<br>
         ${formatInteger(d.AverageHighwayMPG)} highway MPG<br>
         ${formatInteger(d.AverageCityMPG)} city MPG`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip);

  addLegend(svg, ["Gasoline", "Diesel"], 800, 5);

  const fourCylinderAverage = d3.mean(
    data.filter((d) => d.EngineCylinders === 4),
    (d) => d.AverageHighwayMPG
  );

  addAnnotation(svg, {
    x: x(4),
    y: y(fourCylinderAverage),
    dx: 70,
    dy: -78,
    width: 215,
    title: "Smaller engines travel farther",
    label: `Four-cylinder vehicles average ${formatOneDecimal(fourCylinderAverage)} highway MPG.`
  });
}

function drawCityHighwayScene() {
  const data = state.data.filter((d) => d.EngineCylinders > 0);
  const fuels = ["All", "Gasoline", "Diesel"];
  buildFuelControls(fuels);

  const { svg, x, y } = chartFrame({
    xDomain: [9, 40],
    yDomain: [14, 44],
    xLabel: "Average city MPG",
    yLabel: "Average highway MPG",
    xTicks: 7,
    yTicks: 6
  });

  svg.append("title").text("Scatterplot comparing average city and highway miles per gallon.");

  svg
    .append("line")
    .attr("x1", x(14))
    .attr("y1", y(14))
    .attr("x2", x(40))
    .attr("y2", y(40))
    .attr("stroke", "#9a9387")
    .attr("stroke-width", 1.4)
    .attr("stroke-dasharray", "6 5");

  svg
    .append("text")
    .attr("class", "reference-label")
    .attr("x", x(36.5))
    .attr("y", y(36.5) - 10)
    .attr("text-anchor", "end")
    .text("equal city and highway MPG");

  svg
    .append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("class", "data-point")
    .attr("cx", (d) => x(d.AverageCityMPG))
    .attr("cy", (d) => y(d.AverageHighwayMPG))
    .attr("r", (d) => 4.2 + Math.min(d.EngineCylinders, 12) * 0.25)
    .attr("fill", (d) => palette[d.Fuel])
    .attr("opacity", (d) => pointOpacity(d.Fuel))
    .on("mouseenter", (event, d) => {
      const gap = d.AverageHighwayMPG - d.AverageCityMPG;
      showTooltip(
        event,
        `<strong>${escapeHtml(d.Make)}</strong>
         <span class="tooltip-accent">${escapeHtml(d.Fuel)}</span><br>
         ${formatInteger(d.AverageCityMPG)} city MPG<br>
         ${formatInteger(d.AverageHighwayMPG)} highway MPG<br>
         Highway difference: ${gap > 0 ? "+" : ""}${formatInteger(gap)} MPG`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip);

  addLegend(svg, ["Gasoline", "Diesel"], 800, 5);

  const highlighted = data.find(
    (d) =>
      d.Make === "Chrysler" &&
      d.AverageCityMPG === 23 &&
      d.AverageHighwayMPG === 36
  );

  if (highlighted) {
    addAnnotation(svg, {
      x: x(highlighted.AverageCityMPG),
      y: y(highlighted.AverageHighwayMPG),
      dx: -200,
      dy: -135,
      width: 260,
      title: "The highway advantage can be large",
      label: "This Chrysler average rises from 23 city MPG to 36 highway MPG."
    });
  }
}

function drawFuelScene() {
  const fuels = ["All", "Gasoline", "Diesel", "Electricity"];
  buildFuelControls(fuels);

  const metrics = [
    { key: "AverageCityMPG", label: "City" },
    { key: "AverageHighwayMPG", label: "Highway" }
  ];

  const fuelOrder = ["Gasoline", "Diesel", "Electricity"];
  const averages = fuelOrder.map((fuel) => {
    const rows = state.data.filter((d) => d.Fuel === fuel);
    return {
      Fuel: fuel,
      count: rows.length,
      AverageCityMPG: d3.mean(rows, (d) => d.AverageCityMPG),
      AverageHighwayMPG: d3.mean(rows, (d) => d.AverageHighwayMPG)
    };
  });

  const width = 860;
  const height = 510;
  const margin = { top: 28, right: 32, bottom: 74, left: 70 };

  const svg = chartContainer
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img");

  svg.append("title").text("Grouped bar chart comparing average city and highway efficiency by fuel type.");

  const x0 = d3
    .scaleBand()
    .domain(fuelOrder)
    .range([margin.left, width - margin.right])
    .paddingInner(0.28);

  const x1 = d3
    .scaleBand()
    .domain(metrics.map((d) => d.key))
    .range([0, x0.bandwidth()])
    .padding(0.12);

  const y = d3
    .scaleLinear()
    .domain([0, 130])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3
        .axisLeft(y)
        .ticks(7)
        .tickSize(-(width - margin.left - margin.right))
        .tickFormat("")
    );

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x0).tickSizeOuter(0));

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(7).tickSizeOuter(0));

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + height - margin.bottom) / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .text("Average MPG / MPGe");

  const groups = svg
    .append("g")
    .selectAll("g")
    .data(averages)
    .join("g")
    .attr("transform", (d) => `translate(${x0(d.Fuel)},0)`);

  groups
    .selectAll("rect")
    .data((fuel) =>
      metrics.map((metric) => ({
        Fuel: fuel.Fuel,
        count: fuel.count,
        metric: metric.key,
        metricLabel: metric.label,
        value: fuel[metric.key]
      }))
    )
    .join("rect")
    .attr("class", "bar")
    .attr("x", (d) => x1(d.metric))
    .attr("y", y(0))
    .attr("width", x1.bandwidth())
    .attr("height", 0)
    .attr("rx", 4)
    .attr("fill", (d) => {
      const base = d3.color(palette[d.Fuel]);
      return d.metric === "AverageCityMPG" ? base.brighter(0.55) : base;
    })
    .attr("opacity", (d) => pointOpacity(d.Fuel))
    .on("mouseenter", (event, d) => {
      const unit = d.Fuel === "Electricity" ? "MPGe" : "MPG";
      showTooltip(
        event,
        `<strong>${escapeHtml(d.Fuel)} · ${d.metricLabel}</strong>
         <span class="tooltip-accent">${formatOneDecimal(d.value)} ${unit}</span><br>
         Average of ${d.count} manufacturer records`
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", hideTooltip)
    .transition()
    .duration(650)
    .ease(d3.easeCubicOut)
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => y(0) - y(d.value));

  groups
    .selectAll("text.value-label")
    .data((fuel) =>
      metrics.map((metric) => ({
        Fuel: fuel.Fuel,
        metric: metric.key,
        value: fuel[metric.key]
      }))
    )
    .join("text")
    .attr("class", "reference-label value-label")
    .attr("x", (d) => x1(d.metric) + x1.bandwidth() / 2)
    .attr("y", (d) => y(d.value) - 8)
    .attr("text-anchor", "middle")
    .attr("opacity", (d) => pointOpacity(d.Fuel))
    .text((d) => formatOneDecimal(d.value));

  const metricLegend = svg.append("g").attr("class", "legend").attr("transform", "translate(750, -20)");

  metrics.forEach((metric, i) => {
    metricLegend
      .append("rect")
      .attr("x", 0)
      .attr("y", i * 24)
      .attr("width", 13)
      .attr("height", 13)
      .attr("rx", 2)
      .attr("fill", i === 0 ? "#8a9aae" : "#102d58");

    metricLegend
      .append("text")
      .attr("x", 20)
      .attr("y", i * 24 + 11)
      .text(metric.label);
  });
  
  metricLegend
  .append("rect")
  .attr("x", 0)
  .attr("y", metrics.length * 24)
  .attr("width", 13)
  .attr("height", 13)
  .attr("rx", 2)
  .attr("fill", d3.color(palette["Electricity"]).brighter(0.55))
  
  metricLegend
  .append("text")
  .attr("x", 20)
  .attr("y", metrics.length * 24 + 11)
  .text("Electricity");

  const electric = averages.find((d) => d.Fuel === "Electricity");
  addAnnotation(svg, {
    x: x0("Electricity") + x1("AverageCityMPG") + x1.bandwidth() / 2,
    y: y(electric.AverageCityMPG),
    dx: -265,
    dy: 32,
    width: 235,
    title: "Electric vehicles use MPGe",
    label: "Their energy-equivalent ratings are much higher than combustion MPG values."
  });
}

function buildFuelControls(fuels) {
  const controls = d3
    .select("#fuel-controls")
    .selectAll("button")
    .data(fuels, (d) => d)
    .join("button")
    .attr("type", "button")
    .attr("class", "filter-button")
    .classed("active", (d) => d === state.activeFuel)
    .attr("aria-pressed", (d) => String(d === state.activeFuel))
    .text((d) => d)
    .on("click", (event, fuel) => {
      state.activeFuel = fuel;
      hideTooltip();
      renderScene();
    });

  controls.attr("title", (d) => (d === "All" ? "Show every fuel type" : `Show ${d} only`));
}

function pointOpacity(fuel) {
  return state.activeFuel === "All" || state.activeFuel === fuel ? 0.82 : 0.1;
}

function addLegend(svg, labels, x, y) {
  const legend = svg.append("g").attr("class", "legend").attr("transform", `translate(${x},${y})`);

  labels.forEach((label, i) => {
    legend
      .append("circle")
      .attr("cx", 0)
      .attr("cy", i * 24)
      .attr("r", 5)
      .attr("fill", palette[label]);

    legend
      .append("text")
      .attr("x", 12)
      .attr("y", i * 24 + 4)
      .text(label);
  });
}

function addAnnotation(svg, { x, y, dx, dy, width, title, label }) {
  const boxX = x + dx;
  const boxY = y + dy;
  const boxHeight = 74;
  const connectorEndX = dx >= 0 ? boxX : boxX + width;
  const connectorEndY = boxY + boxHeight / 2;
  const elbowX = x + dx * 0.42;

  const annotation = svg.append("g").attr("class", "annotation");

  annotation
    .append("path")
    .attr("class", "annotation-connector")
    .attr("d", `M${x},${y} L${elbowX},${connectorEndY} L${connectorEndX},${connectorEndY}`);

  annotation
    .append("circle")
    .attr("class", "annotation-target")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", 6.5);

  annotation
    .append("rect")
    .attr("class", "annotation-box")
    .attr("x", boxX)
    .attr("y", boxY)
    .attr("width", width)
    .attr("height", boxHeight)
    .attr("rx", 7);

  annotation
    .append("text")
    .attr("class", "annotation-title")
    .attr("x", boxX + 16)
    .attr("y", boxY + 25)
    .text(title);

  const labelText = annotation
    .append("text")
    .attr("class", "annotation-label")
    .attr("x", boxX + 16)
    .attr("y", boxY + 48);

  wrapText(labelText, label, width - 32, 14);
}

function wrapText(textSelection, text, maxWidth, lineHeight) {
  const words = text.split(/\s+/).reverse();
  let word;
  let line = [];
  let lineNumber = 0;
  const x = +textSelection.attr("x");
  const y = +textSelection.attr("y");

  let tspan = textSelection.append("tspan").attr("x", x).attr("y", y);

  while ((word = words.pop())) {
    line.push(word);
    tspan.text(line.join(" "));
    if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
      line.pop();
      tspan.text(line.join(" "));
      line = [word];
      tspan = textSelection
        .append("tspan")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", `${++lineNumber * lineHeight}px`)
        .text(word);
    }
  }
}

function linearRegression(xValues, yValues) {
  const n = xValues.length;
  const meanX = d3.mean(xValues);
  const meanY = d3.mean(yValues);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i += 1) {
    numerator += (xValues[i] - meanX) * (yValues[i] - meanY);
    denominator += (xValues[i] - meanX) ** 2;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}

function showTooltip(event, html) {
  tooltip.html(html).attr("aria-hidden", "false").classed("visible", true);
  moveTooltip(event);
}

function moveTooltip(event) {
  const padding = 18;
  const node = tooltip.node();
  const width = node.offsetWidth || 230;
  const height = node.offsetHeight || 110;

  let left = event.clientX + 14;
  let top = event.clientY + 14;

  if (left + width + padding > window.innerWidth) left = event.clientX - width - 20;
  if (top + height + padding > window.innerHeight) top = event.clientY - height - 20;

  tooltip.style("left", `${left}px`).style("top", `${top}px`);
}

function hideTooltip() {
  tooltip.attr("aria-hidden", "true").classed("visible", false);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

initializeInterface();

d3.csv("cars2017.csv", parseCar)
  .then((data) => {
    state.data = data.filter(
      (d) =>
        d.Make &&
        d.Fuel &&
        Number.isFinite(d.EngineCylinders) &&
        Number.isFinite(d.AverageHighwayMPG) &&
        Number.isFinite(d.AverageCityMPG)
    );

    renderScene();
  })
  .catch((error) => {
    console.error(error);
    chartContainer.html(
      `<div class="error-message">
        <strong>The CSV file could not be loaded.</strong><br>
        Run this project through Phoenix Code Live Preview or a local web server instead of opening index.html directly from your file system.
      </div>`
    );
  });
