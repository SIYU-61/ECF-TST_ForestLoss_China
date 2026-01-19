# ECF-TST_ForestLoss_China
Code for “Mapping Forest Cover Loss in China (2000-2024) using an Ecoregion-Constrained Feature and Temporal-Spatial Trajectory (ECF-TST) Framework”
# Mapping Forest Cover Loss in China (2000-2024) using an Ecoregion-Constrained Feature and Temporal-Spatial Trajectory (ECF-TST) Framework

This repository contains the Google Earth Engine (GEE) JavaScript code and documentation for reproducing the analysis of the manuscript titled **China’s two-decade forest loss revealed by an ecoregion-constrained fusion of temporal, spectral, and texture features**.
 

## 🔍 Overview
This study developed an **Ecoregion-Constrained Feature and Temporal-Spatial Trajectory (ECF-TST)** framework to map annual forest cover loss (FCL) across China from 2000 to 2024 at a 30-m resolution. To address pronounced spatial heterogeneity, we:
1.  Divided China into 35 ecological regions.
2.  Constructed a multi-dimensional feature set (spectral, temporal, textural, climatic, topographic, socioeconomic) for each region.
3.  Independently trained and optimized a Random Forest classifier for each ecoregion.
4.  Applied a probabilistic thresholding and spatial post-processing to generate robust annual FCL maps.

The code here details the two main computational steps executed on the **Google Earth Engine** cloud platform.

## 🚀 Quick Start: Reproducing the Analysis
The analysis is performed in two sequential steps:

### 1. Model Training & Optimization (Ecoregion-Specific)
**File:** `Code/1_ECF_TST_Model_Training_and_Optimization.js`
*   **Purpose:** To find the optimal feature subset and hyperparameters for the Random Forest classifier for a **single ecoregion**.
*   **How to run:**
    1.  Open the script in the [GEE Code Editor](https://code.earthengine.google.com/).
    2.  Set the `ecoZone` variable (line ~60) to an ID between 1 and 35.
    3.  Ensure you have access to the sample point assets (paths defined in lines ~40-75). *Note: These are currently private assets. For review, we can provide a sample subset or the exact coordinates as a CSV file upon request.*
    4.  Run the script. It will export a CSV with performance metrics for all parameter combinations to your Google Drive.

### 2. Annual FCL Mapping
**File:** `Code/2_ECF_TST_Annual_FCL_Mapping.js`
*   **Purpose:** To apply the optimized model to generate a FCL map for a **specific year and ecoregion**.
*   **How to run:**
    1.  Open the script in the GEE Code Editor.
    2.  Set `targetYear` and `id` (ecoregion ID) in the user configuration section (lines ~150-151).
    3.  Ensure you have access to the trained model assets (e.g., `projects/.../assets/RF2_Optimized_Model_E1`) and the GLC_FCS30 forest mask assets.
    4.  Run the script. The smoothed classification map will be exported to your Google Drive.

**Note:** Generating the **full national time series (2000-2024, 35 ecoregions)** requires looping this script 875 (25*35) times. This is managed externally, and the final aggregated products are available via the dataset DOI.

## 📂 Repository Structure
ECF-TST_ForestCoverLoss_China/
│
├── README.md                          
├── LICENSE                            
│
├── Code/
│   ├── 1_ECF_TST_Model_Training_and_Optimization.js
│   ├── 2_ECF_TST_Annual_FCL_Mapping.js
│   └── requirements.txt                
│
├── Data_Description/
│   ├── Data_Availability_Statement.md  
│   └── EcoRegion_Info.csv              
│
└── Figures/
    └── Workflow_Figure.png    

## 📊 Data
The entire analysis relies on publicly available datasets processed on Google Earth Engine. A complete **Data Availability Statement** is provided in `Data_Description/Data_Availability_Statement.md`.

The resulting **annual forest cover loss maps for China (2000–2024)** are publicly available on Figshare: [10.6084/m9.figshare.30656924](https://doi.org/10.6084/m9.figshare.30656924).

## 📝 Methodological Correspondence
The code directly implements the methods described in the manuscript:
*   **Section 2.2.2 & 2.3.2:** Feature extraction and model training/mapping workflow.
*   **Figure 2:** The overall ECF-TST framework visualized in the paper corresponds to the two-script pipeline here.

For detailed explanations of sample collection (Fig. 1), feature engineering, and statistical analysis, please refer to the manuscript.

## ⚙️ Dependencies
*   **Platform:** [Google Earth Engine](https://earthengine.google.com/) (A registered account is required to execute the scripts).
*   **GEE API:** JavaScript.
*   **Key GEE Assets Used:** The scripts load private assets for samples, models, and forest masks. Their public analogs or extraction methods are described in the manuscript.
*   **External Module:** The LandTrendr module (`users/emaprlab/public:Modules/LandTrendr.js`) is required for building the annual image collection.

## 🔒 License
This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgements
We acknowledge the use of data and infrastructure from Google Earth Engine.    
