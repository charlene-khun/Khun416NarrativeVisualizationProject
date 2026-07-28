# 2017 Automobile Efficiency — D3 Narrative Visualization

This project is an **interactive slideshow** with three D3 scenes built from `cars2017.csv`.

## Project files

- `index.html` — Index.html is the main page for my website. Provides my website with structure and contains D3 JS script imports.
- `styles.css` — Styles.css contains styling for the layout, responsive design, annotations, controls, and tooltips.
- `script.js` — Script.js contains data loading, state parameters, scene construction, annotations, and triggers.
- `cars2017_unique_no_overlap.csv` — cars2017_unique_no_overlap.csv is the cleaned version of cars.2017.csv. Cars.2017.csv is the public data I am using from the Prof Hart's github page: https://github.com/flunky/flunky.github.io.

## Narrative structure

My visualization uses the interactive slideshow structure in the following order:

1. Engine cylinders vs. average highway MPG
2. Average City MPG vs. Average highway MPG
3. Average efficiency by fuel type

Each scene includes a persistent annotation, free-form hover tooltips, and navigation triggers. The JavaScript state variables `state.scene` and `state.activeFuel` act as the main parameters controlling what is displayed.
