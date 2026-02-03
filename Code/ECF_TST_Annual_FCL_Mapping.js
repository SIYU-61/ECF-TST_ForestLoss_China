/**
 * =================================================================================
 * ECF-TST Framework: Annual Forest Cover Loss (FCL) Mapping
 * =================================================================================
 * 
 * Purpose: This script applies an ecoregion-optimized classifier to generate an
 * annual FCL map for a specific target year and ecoregion. It performs multi-
 * dimensional feature extraction and post-processing.
 * 
 * Corresponding Manuscript Sections:
 * - 2.2.2 "Multidimensional Feature Dataset" (Feature engineering)
 * - 2.3.2 "Ecoregion-Specific Model Training, Optimization, and FCL Mapping"
 * 
 * Workflow:
 * 1. Builds annual Landsat SR composites (2000-targetYear).
 * 2. Calculates spectral indices (NBR, NDVI, etc.).
 * 3. Extracts spectral, temporal, textural, climatic, and topographic features.
 * 4. Loads the pre-trained model and optimal feature subset for the ecoregion.
 * 5. Classifies the feature image and applies post-processing (smoothing).
 * 6. Exports the final FCL map for the target year/ecoregion.
 * 
 * Key Notes:
 * - This script is run PER ECOREGION and PER YEAR (e.g., 35 ecoregions * 25 years).
 * - The forest mask is based on the GLC_FCS30-2000 baseline (Section 2.2.2).
 * - Post-processing includes focal smoothing to reduce noise.
 * - The final national FCL time series is a mosaic of all ecoregion/year outputs.
 * 
 * Data Sources Cited:
 * - Landsat Surface Reflectance: USGS/NASA.
 * - Climate Data: ECMWF ERA5-Land (Hersbach et al., 2020).
 * - Topography: NASA SRTM (Farr et al., 2007).
 * - Forest Baseline: GLC_FCS30 (Zhang et al., 2020).
 * - Administrative Boundaries: LSIB (US Dept. of State).
 * 
 * =================================================================================
 */

// -------------------------------
// 0. DEPENDENCIES
// -------------------------------

// Import the LandTrendr module for time series segmentation.
var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js');

// -------------------------------
// 1. USER CONFIGURATION
// -------------------------------
// USER MUST SET THESE TWO VARIABLES
var TARGET_YEAR = 2020;  // Set the target year for mapping (2000 to 2024).
var ECOREGION_ID = 20;   // Set the target ecoregion ID (1 to 35).

print('===================================');
print('ECF-TST Annual FCL Mapping');
print('Target Year:', TARGET_YEAR);
print('Target Ecoregion ID:', ECOREGION_ID);
print('===================================');

// -------------------------------
// 2. CONSTANTS & FEATURE SCHEMAS
// -------------------------------

// Core spectral indices used for feature construction.
var INDEX_BANDS = ['NBR', 'NDVI', 'NDMI', 'NDBI', 'RVI', 'SAVI', 'EVI', 'DVI'];

// Naming convention for derived temporal features.
var CHG_RA_NAMES = INDEX_BANDS.map(function(b) { return b + '_chg_ra'; });
var ROL_3Y_NAMES = INDEX_BANDS.map(function(b) { return b + '_rol_3y'; });
var ROL_5Y_NAMES = INDEX_BANDS.map(function(b) { return b + '_rol_5y'; });
var VOLA_5Y_NAMES = INDEX_BANDS.map(function(b) { return b + '_vola_5y'; });
var AN_CHA_NAMES = INDEX_BANDS.map(function(b) { return b + '_an_cha'; });
var CHG_AC_NAMES = INDEX_BANDS.map(function(b) { return b + '_chg_ac'; });
var MEAN_NAMES = INDEX_BANDS.map(function(b) { return b + '_mean'; });
var RECO_S_NAMES = INDEX_BANDS.map(function(b) { return b + '_reco_s'; });

// -------------------------------
// 3. LOAD STATIC DATASETS
// -------------------------------

// 3.1 Topography: SRTM Digital Elevation Model
var srtm = ee.Image("USGS/SRTMGL1_003");

// 3.2 Administrative: China boundary for clipping
var china = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017")
              .filter(ee.Filter.eq('country_na', 'China'));

// 3.3 Climate Baseline: 1990-2020 mean temperature for anomaly calculation
var baselineTemp = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY')
  .filterDate('1990-01-01', '2020-12-31')
  .select('skin_temperature')
  .mean()
  .subtract(273.15); // Convert Kelvin to Celsius

// 3.4 Forest Cover Baseline: GLC_FCS30 for year 2000
// The 'lc' image is a mosaic of 62 tiles covering China.
var image1 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E70N40_Annual");
var image2 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E70N45_Annual");
var image3 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E75N35_Annual");
var image4 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E75N40_Annual");
var image5 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E75N45_Annual");
var image6 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E80N30_Annual");
var image7 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E80N35_Annual");
var image8 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E80N40_Annual");
var image9 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E80N45_Annual");
var image10 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E80N50_Annual");
var image11 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E85N30_Annual");
var image12 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E85N35_Annual");
var image13 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E85N40_Annual");
var image14 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E85N45_Annual");
var image15 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E85N50_Annual");
var image16 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E90N30_Annual");
var image17 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E90N35_Annual");
var image18 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E90N40_Annual");
var image19 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E90N45_Annual");
var image20 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E90N50_Annual");
var image21 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E95N25_Annual");
var image22 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E95N30_Annual");
var image23 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E95N35_Annual");
var image24 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E95N40_Annual");
var image25 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E95N45_Annual");
var image26 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E100N25_Annual");
var image27 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E100N30_Annual");
var image28 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E100N35_Annual");
var image29 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E100N40_Annual");
var image30 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E100N45_Annual");
var image31 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E105N20_Annual");
var image32 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E105N25_Annual");
var image33 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E105N30_Annual");
var image34 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E105N35_Annual");
var image35 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E105N40_Annual");
var image36 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E105N45_Annual");
var image37 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E110N25_Annual");
var image38 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E110N30_Annual");
var image39 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E110N35_Annual");
var image40 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E110N40_Annual");
var image41 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E110N45_Annual");
var image42 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E110N50_Annual");
var image43 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E115N25_Annual");
var image44 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E115N30_Annual");
var image45 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E115N35_Annual");
var image46 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E115N40_Annual");
var image47 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E115N45_Annual");
var image48 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E115N50_Annual");
var image49 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E115N55_Annual");
var image50 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E120N25_Annual");
var image51 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E120N30_Annual");
var image52 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E120N35_Annual");
var image53 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E120N40_Annual");
var image54 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E120N45_Annual");
var image55 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E120N50_Annual");
var image56 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E120N55_Annual");
var image57 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E125N45_Annual");
var image58 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E125N50_Annual");
var image59 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E125N55_Annual");
var image60 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E130N45_Annual");
var image61 = ee.Image("projects/polished-autumn-296103/assets/GLC_FCS30D_20002022_E130N50_Annual");
var image62 = ee.Image("projects/polished-autumn-296103/assets/E135N50");
var lc = ee.ImageCollection.fromImages([
  image1, image2, image3, image4, image5, image6, image7, image8, image9, image10,
  image11, image12, image13, image14, image15, image16, image17, image18, image19, image20,
  image21, image22, image23, image24, image25, image26, image27, image28, image29, image30,
  image31, image32, image33, image34, image35, image36, image37, image38, image39, image40,
  image41, image42, image43, image44, image45, image46, image47, image48, image49, image50,
  image51, image52, image53, image54, image55, image56, image57, image58, image59, image60,
  image61, image62
]).median().select('b1'); // Select the band for year 2000

// Create a forest mask (pixels with forest class codes 50-92).
var forestMask = lc.expression('band >= 50 && band <= 92', {'band': lc});
print('Forest mask (GLC_FCS30 2000) loaded.');

// -------------------------------
// 4. LOAD ECOREGION-SPECIFIC ASSETS
// -------------------------------

// 4.1 Ecoregion Geometries
var geometry1 = ee.FeatureCollection('users/ldf160107/climate_region/A01');
var geometry2 = ee.FeatureCollection('users/ldf160107/climate_region/A02');
var geometry3 = ee.FeatureCollection('users/ldf160107/climate_region/A03');
var geometry4 = ee.FeatureCollection('users/ldf160107/climate_region/A04');
var geometry5 = ee.FeatureCollection('users/ldf160107/climate_region/A05');
var geometry6 = ee.FeatureCollection('users/ldf160107/climate_region/A07');
var geometry7 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-8');
var geometry8 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-10');
var geometry9 = ee.FeatureCollection('users/ldf160107/climate_region/A11');
var geometry10 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-12');
var geometry11 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-14');
var geometry12 = ee.FeatureCollection('users/ldf160107/climate_region/A15');
var geometry13 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-16');
var geometry14 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-17');
var geometry15 = ee.FeatureCollection('users/ldf160107/climate_region/A18');
var geometry16 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-19');
var geometry17 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-20');
var geometry18 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-21');
var geometry19 = ee.FeatureCollection('users/ldf160107/climate_region/A22');
var geometry20 = ee.FeatureCollection('users/ldf160107/climate_region/A23');
var geometry21 = ee.FeatureCollection('users/ldf160107/climate_region/A24');
var geometry22 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-25');
var geometry23 = ee.FeatureCollection('users/ldf160107/climate_region/A26');
var geometry24 = ee.FeatureCollection('users/ldf160107/climate_region/A27');
var geometry25 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-28');
var geometry26 = ee.FeatureCollection('projects/polished-autumn-296103/assets/i-29');
var geometry27 = ee.FeatureCollection('users/ldf160107/climate_region/A30');
var geometry28 = ee.FeatureCollection('users/ldf160107/climate_region/A31');
var geometry29 = ee.FeatureCollection('users/ldf160107/climate_region/A32');
var geometry30 = ee.FeatureCollection('users/ldf160107/climate_region/A33');
var geometry31 = ee.FeatureCollection('projects/polished-autumn-296103/assets/ii-1');
var geometry32 = ee.FeatureCollection('users/ldf160107/climate_region/II05');
var geometry33 = ee.FeatureCollection('users/ldf160107/climate_region/II07');
var geometry34 = ee.FeatureCollection('projects/polished-autumn-296103/assets/iii-7');
var geometry35 = ee.FeatureCollection('users/ldf160107/climate_region/III09');
var aoiList = [geometry1,  geometry2,  geometry3,  geometry4,  geometry5,
  geometry6,  geometry7,  geometry8,  geometry9,  geometry10,
  geometry11, geometry12, geometry13, geometry14, geometry15,
  geometry16, geometry17, geometry18, geometry19, geometry20,
  geometry21, geometry22, geometry23, geometry24, geometry25,
  geometry26, geometry27, geometry28, geometry29, geometry30,
  geometry31, geometry32, geometry33, geometry34, geometry35];
var aoi = aoiList[ECOREGION_ID - 1]; // JS uses 0-based indexing.

// 4.2 Optimal Feature Subsets (Result of RFE)
var optimalFeatures1  = ["a_precip","p_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_cor","B7_ent","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDMI_r_m_5","NDVI_mean","NDVI_c_ac","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","NBR_c_ac","NBR_r_m_5","EVI_mean","EVI_trend","EVI_c_ac","EVI_r_m_3","EVI_r_sl","RVI_c_ac","RVI_r_m_3","RVI_r_m_5","RVI_r_sl","DVI_mean","DVI_c_ac","DVI_r_m_3","DVI_r_m_5","SAVI_mean","SAVI_trend","SAVI_c_ac","SAVI_r_m_3","SAVI_r_m_5"];
var optimalFeatures2  = ["p_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_mean","B7_con","B7_cor","B7_ent","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDVI_c_ac","NDVI_r_m_3","NDVI_v_5","NDVI_r_sl","NBR_c_ac","NBR_r_m_5","EVI_v_5","RVI_v_5","SAVI_trend"];
var optimalFeatures3  = ["su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_cor","B7_ent","B7_mean","NDBI_r_m_3","NDMI_r_m_5","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","EVI_r_m_3","EVI_r_m_5","EVI_r_sl","RVI_r_m_3","RVI_r_m_5","SAVI_mean","SAVI_r_m_5","SAVI_v_5"];
var optimalFeatures4  = ["a_precip","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_stdDev","B7_stdDev","B7_con","B7_cor","B7_mean","NDBI_r_m_3","NDVI_mean","NDVI_r_m_5","EVI_mean","EVI_r_m_3","EVI_r_m_5","RVI_r_m_3","RVI_v_5","DVI_v_5","SAVI_mean"];
var optimalFeatures5  = ["NDBI","NDMI","NDVI","NBR","RVI","SAVI","B3_stdDev","B3_mean","B7_mean","NDBI_mean","NDBI_r_m_3","NDMI_mean","NDMI_r_m_3","NDMI_r_m_5","NDVI_mean","NDVI_r_m_3","NBR_mean","NBR_r_m_5","SAVI_mean","SAVI_r_m_3"];
var optimalFeatures6  = ["p_precip","su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_stdDev","B1_mean","B7_con","B7_ent","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDMI_r_m_5","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NBR_r_m_5","EVI_r_m_3","EVI_r_m_5","EVI_v_5","RVI_r_m_5","RVI_v_5","DVI_r_m_5","DVI_r_sl","SAVI_mean","SAVI_trend","SAVI_r_m_5"];
var optimalFeatures7  = ["a_precip","p_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_mean","B4_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_cor","B7_ent","B7_mean","NDBI_r_m_3","NDMI_r_m_5","NDVI_mean","NDVI_c_ac","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","NBR_c_ac","NBR_r_m_5","EVI_mean","EVI_trend","EVI_r_m_3","EVI_r_m_5","EVI_v_5","EVI_r_sl","RVI_c_ac","RVI_r_m_3","RVI_r_m_5","RVI_v_5","RVI_r_sl","DVI_c_ac","DVI_r_m_3","DVI_v_5","SAVI_mean","SAVI_trend","SAVI_c_ac","SAVI_r_m_3","SAVI_r_m_5","SAVI_v_5","SAVI_r_sl"];
var optimalFeatures8  = ["p_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B7_stdDev","B1_mean","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDVI_mean","NDVI_c_ac","NDVI_r_m_5","NDVI_v_5","NBR_r_m_5","EVI_r_m_3","EVI_r_m_5","EVI_v_5","RVI_r_m_3","RVI_r_m_5","RVI_v_5","DVI_mean","DVI_c_ac","DVI_r_m_3","DVI_r_m_5","DVI_v_5","DVI_r_sl","SAVI_mean","SAVI_r_m_3","SAVI_r_m_5","SAVI_v_5"];
var optimalFeatures9  = ["a_precip","p_precip","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_ent","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDMI_r_m_5","NDVI_mean","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","NBR_r_m_5","EVI_mean","EVI_r_m_5","RVI_r_m_3","RVI_r_m_5","RVI_r_sl","SAVI_mean","SAVI_v_5","SAVI_r_sl"];
var optimalFeatures10 = ["NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","SAVI","B3_stdDev","B3_mean","B1_stdDev","B7_stdDev","B1_mean","B7_mean","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","RVI_r_m_5","SAVI_mean","SAVI_r_m_3","SAVI_v_5"];
var optimalFeatures11 = ["p_precip","su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_cor","B7_ent","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDMI_r_m_5","NDVI_mean","NDVI_r_m_5","NDVI_v_5","NBR_r_m_5","EVI_r_m_5","EVI_v_5","RVI_r_m_5","RVI_v_5","SAVI_mean","SAVI_r_m_5","SAVI_v_5"];
var optimalFeatures12 = ["a_precip","p_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_stdDev","B1_mean","B7_con","B7_cor","B7_ent","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDMI_r_m_5","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NBR_r_m_5","EVI_mean","EVI_r_m_5","EVI_v_5","RVI_r_m_3","RVI_r_m_5","RVI_v_5","DVI_r_m_5","DVI_v_5","SAVI_mean","SAVI_r_m_5","SAVI_v_5"];
var optimalFeatures13 = ["a_precip","p_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_ent","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDMI_r_m_5","NDVI_r_m_5","NBR_r_m_5","EVI_r_m_3","EVI_v_5","DVI_v_5","SAVI_trend","SAVI_r_m_3","SAVI_r_m_5"];
var optimalFeatures14 = ["a_precip","p_precip","su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_ent","B7_mean","NDBI_r_m_3","NDMI_r_m_5","NDVI_mean","NDVI_r_m_5","NDVI_v_5","NBR_r_m_5","RVI_r_m_3","RVI_r_m_5","DVI_mean","DVI_r_m_3","SAVI_mean","SAVI_r_m_3","SAVI_r_m_5"];
var optimalFeatures15 = ["p_precip","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_mean","NDMI_r_m_5","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","NBR_r_m_5","EVI_mean","EVI_r_m_5","EVI_v_5","EVI_r_sl","RVI_r_m_3","RVI_r_m_5","RVI_v_5","DVI_r_m_5","SAVI_mean","SAVI_trend","SAVI_r_m_3","SAVI_r_m_5","SAVI_v_5"];
var optimalFeatures16 = ["a_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_stdDev","B1_mean","B7_con","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","NBR_r_m_5","EVI_r_m_5","RVI_r_m_5","RVI_v_5","DVI_mean","DVI_r_m_3","DVI_r_m_5","DVI_v_5","SAVI_mean","SAVI_r_m_3","SAVI_r_m_5","SAVI_v_5","SAVI_r_sl"];
var optimalFeatures17 = ["su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_ent","B7_mean","NDMI_r_m_5","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","NBR_r_m_5","EVI_v_5","RVI_r_m_3","RVI_r_m_5","RVI_v_5","DVI_r_m_3","SAVI_mean","SAVI_r_m_5","SAVI_v_5"];
var optimalFeatures18 = ["a_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B7_stdDev","B1_mean","B7_con","B7_mean","NDBI_r_m_3","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NBR_r_m_5","RVI_r_m_5","DVI_mean","DVI_c_ac","DVI_r_m_3","DVI_r_m_5","SAVI_mean","SAVI_trend","SAVI_r_m_3","SAVI_r_m_5"];
var optimalFeatures19 = ["p_precip","su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_mean","NDBI_r_sl","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","NBR_r_m_5","EVI_r_m_3","EVI_r_m_5","EVI_v_5","RVI_r_m_3","RVI_r_m_5","DVI_mean","SAVI_mean","SAVI_r_m_3","SAVI_r_m_5"];
var optimalFeatures20 = ["p_precip","su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_stdDev","B7_stdDev","B7_con","B7_mean","NDBI_r_sl","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NBR_r_m_5","EVI_r_m_3","EVI_r_m_5","EVI_r_sl","RVI_r_m_3","RVI_r_m_5","DVI_v_5","SAVI_mean","SAVI_r_m_5","SAVI_v_5"];
var optimalFeatures21 = ["a_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_ent","B7_mean","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NBR_r_m_5","EVI_r_m_3","EVI_r_m_5","EVI_v_5","RVI_r_m_3","RVI_r_m_5","DVI_v_5","DVI_r_sl","SAVI_mean","SAVI_r_m_3","SAVI_r_m_5","SAVI_v_5"];
var optimalFeatures22 = ["a_precip","p_precip","su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_mean","B4_mean","B7_stdDev","B1_mean","B7_con","B7_ent","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDMI_r_m_5","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NBR_r_m_5","EVI_mean","EVI_trend","EVI_r_m_3","EVI_r_m_5","EVI_r_sl","RVI_r_m_3","RVI_r_m_5","DVI_mean","DVI_r_m_3","DVI_r_m_5","SAVI_mean","SAVI_r_m_3","SAVI_r_m_5"];
var optimalFeatures23 = ["a_precip","su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B7_stdDev","B1_mean","B7_con","B7_cor","B7_ent","B7_mean","NDBI_r_m_3","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","NBR_c_ac","NBR_r_m_5","EVI_mean","EVI_c_ac","RVI_v_5","DVI_mean","SAVI_mean","SAVI_trend","SAVI_r_m_3","SAVI_r_m_5"];
var optimalFeatures24 = ["a_precip","p_precip","su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_mean","NDBI_r_m_3","NDMI_r_m_5","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","NBR_r_m_5","EVI_r_m_3","EVI_r_m_5","EVI_r_sl","RVI_r_m_3","RVI_r_m_5","RVI_v_5","DVI_r_m_3","SAVI_mean","SAVI_r_m_3","SAVI_r_m_5","SAVI_r_sl"];
var optimalFeatures25 = ["a_precip","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B7_stdDev","B1_mean","B7_con","B7_mean","NDBI_r_m_3","NDBI_r_sl","NDMI_r_m_5","NDVI_mean","NDVI_r_m_5","NDVI_v_5","EVI_mean","EVI_c_ac","EVI_r_m_3","EVI_v_5","EVI_r_sl","RVI_r_m_5","RVI_v_5","DVI_r_m_5","SAVI_mean","SAVI_trend","SAVI_r_m_5","SAVI_v_5"];
var optimalFeatures26 = ["a_precip","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B7_stdDev","B1_mean","B7_con","B7_ent","B7_mean","NDBI_r_sl","NDMI_r_m_5","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NBR_r_m_5","RVI_r_m_3","RVI_r_m_5","RVI_v_5","DVI_mean","DVI_r_m_3","DVI_r_m_5","SAVI_mean","SAVI_c_ac","SAVI_r_m_3","SAVI_r_m_5","SAVI_v_5","SAVI_r_sl"];
var optimalFeatures27 = ["p_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_cor","B7_ent","B7_mean","NDBI_r_m_3","NDMI_r_m_5","NDVI_mean","NDVI_v_5","NDVI_r_sl","NBR_r_m_5","EVI_c_ac","EVI_r_m_5","RVI_r_m_5","DVI_r_m_5","DVI_v_5","SAVI_mean","SAVI_trend"];
var optimalFeatures28 = ["a_precip","p_precip","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B7_stdDev","B1_mean","B7_con","B7_cor","B7_mean","NDBI_r_m_3","NDVI_mean","NDVI_c_ac","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","EVI_mean","EVI_c_ac","EVI_r_m_3","EVI_r_m_5","RVI_r_m_5","RVI_v_5","DVI_mean","DVI_r_m_3","DVI_r_m_5","DVI_v_5","SAVI_mean","SAVI_r_m_3","SAVI_r_m_5"];
var optimalFeatures29 = ["a_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B7_stdDev","B7_con","B7_ent","B7_mean","NDBI_r_m_3","NDMI_r_m_5","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NBR_r_m_5","EVI_r_m_3","EVI_r_m_5","EVI_v_5","RVI_r_m_5","DVI_r_m_5","SAVI_trend","SAVI_r_m_5"];
var optimalFeatures30 = ["p_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_stdDev","B7_stdDev","B7_con","B7_ent","B7_mean","NDBI_r_m_3","NDMI_r_m_5","NDVI_mean","NDVI_r_sl","NBR_r_m_5","EVI_mean","EVI_r_m_3","EVI_r_m_5","EVI_v_5","EVI_r_sl","DVI_r_m_3","SAVI_mean"];
var optimalFeatures31 = ["a_precip","p_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_mean","B4_mean","B7_stdDev","B1_mean","B7_con","B7_cor","B7_ent","B7_mean","NDBI_r_sl","NDMI_r_m_5","NDVI_mean","NDVI_r_m_3","NBR_r_m_5","EVI_trend","EVI_v_5","RVI_r_m_3","RVI_r_m_5","DVI_mean","DVI_r_m_3","DVI_r_m_5","DVI_v_5","SAVI_mean","SAVI_trend","SAVI_r_m_3"];
var optimalFeatures32 = ["su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B1_mean","B7_mean","NDBI_r_m_3","NDMI_r_m_5","NBR_r_m_5","DVI_r_m_3","DVI_r_m_5","DVI_v_5","SAVI_trend"];
var optimalFeatures33 = ["a_precip","p_precip","su_temp","NDBI","NDMI","NDVI","NBR","EVI","RVI","B5_mean","SAVI","B3_mean","B1_mean","B7_mean","NDVI_r_m_5","NDVI_v_5"];
var optimalFeatures34 = ["a_precip","p_precip","su_temp","temp_an","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_ent","B7_mean","NDBI_r_m_3","NDVI_mean","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NBR_r_m_5","EVI_trend","EVI_v_5","RVI_r_m_3","RVI_r_m_5","RVI_v_5","DVI_mean","DVI_r_m_3","DVI_r_m_5","DVI_v_5","SAVI_mean","SAVI_r_m_5"];
var optimalFeatures35 = ["p_precip","NDBI","NDMI","NDVI","NBR","EVI","RVI","DVI","B5_mean","SAVI","B3_stdDev","B3_mean","B4_mean","B1_stdDev","B7_stdDev","B1_mean","B7_con","B7_mean","NDBI_r_m_3","NDMI_r_m_5","NDVI_mean","NDVI_c_ac","NDVI_r_m_3","NDVI_r_m_5","NDVI_v_5","NDVI_r_sl","NBR_r_m_5","EVI_mean","RVI_r_m_5","DVI_r_sl","SAVI_mean","SAVI_trend","SAVI_r_m_5"];

var featsList = [
  optimalFeatures1,  optimalFeatures2,  optimalFeatures3,  optimalFeatures4,  optimalFeatures5,
  optimalFeatures6,  optimalFeatures7,  optimalFeatures8,  optimalFeatures9,  optimalFeatures10,
  optimalFeatures11, optimalFeatures12, optimalFeatures13, optimalFeatures14, optimalFeatures15,
  optimalFeatures16, optimalFeatures17, optimalFeatures18, optimalFeatures19, optimalFeatures20,
  optimalFeatures21, optimalFeatures22, optimalFeatures23, optimalFeatures24, optimalFeatures25,
  optimalFeatures26, optimalFeatures27, optimalFeatures28, optimalFeatures29, optimalFeatures30,
  optimalFeatures31, optimalFeatures32, optimalFeatures33, optimalFeatures34, optimalFeatures35
];
var optimalFeatures = featsList[ECOREGION_ID - 1];

// 4.3 Pre-trained Model Assets
var modelList = [
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E1',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E2',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E3',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E4',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E5',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E6',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E7',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E8',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E9',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E10',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E11',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E12',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E13',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E14',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E15',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E16',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E17',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E18',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E19',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E20',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E21',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E22',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E23',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E24',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E25',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E26',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E27',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E28',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E29',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E30',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E31',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E32',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E33',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E34',
  'projects/polished-autumn-296103/assets/RF2_Optimized_Model_E35'
];
var modelPath = modelList[ECOREGION_ID - 1];

print('Ecoregion geometry loaded.');
print('Optimal feature subset loaded:', optimalFeatures);
print('Model path:', modelPath);

// -------------------------------
// 5. FUNCTIONS FOR FEATURE EXTRACTION
// -------------------------------

/**
 * Calculates common spectral vegetation indices from a Landsat SR image.
 * @param {ee.Image} img - Input Landsat surface reflectance image.
 * @returns {ee.Image} Input image with added index bands.
 */
var addIndices = function(img) {
  var nbr = img.normalizedDifference(['B4', 'B7']).multiply(1000).rename('NBR');
  var ndvi = img.normalizedDifference(['B4', 'B3']).multiply(1000).rename('NDVI');
  var ndmi = img.normalizedDifference(['B4', 'B5']).multiply(1000).rename('NDMI');
  var ndbi = img.normalizedDifference(['B5', 'B4']).multiply(1000).rename('NDBI');
  var rvi = img.select('B4').divide(img.select('B3')).multiply(1000).rename('RVI');
  var dvi = img.select('B4').subtract(img.select('B3')).rename('DVI');
    
  var savi = img.expression(
    '(1 + L) * (NIR - RED) / (NIR + RED + L)', {
      'NIR': img.select('B4'),
      'RED': img.select('B3'),
      'L': 0.5
    }).multiply(1000).rename('SAVI');
    
  var evi = img.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': img.select('B4'),
      'RED': img.select('B3'),
      'BLUE': img.select('B1')
    }).multiply(1000).rename('EVI');
    
  return img
    .addBands(nbr)
    .addBands(ndvi)
    .addBands(ndmi)
    .addBands(ndbi)
    .addBands(rvi)
    .addBands(savi)
    .addBands(evi)
    .addBands(dvi);
};

/**
 * Extracts first-order texture (mean, stdDev) using a 3x3 kernel.
 * @param {ee.Image} image - Input image (typically target year composite).
 * @returns {ee.Image} Image with added texture bands.
 */
var addFirstOrderTexture = function(image) {
  var meanReducer = ee.Reducer.mean();
  var stdReducer = ee.Reducer.stdDev();
  var kernel = ee.Kernel.square(3, 'pixels');
  
  var B1mean = image.select('B1').reduceNeighborhood(meanReducer, kernel).rename('B1_mean');
  var B1std = image.select('B1').reduceNeighborhood(stdReducer, kernel).rename('B1_stdDev');
  var B2mean = image.select('B2').reduceNeighborhood(meanReducer, kernel).rename('B2_mean');
  var B2std = image.select('B2').reduceNeighborhood(stdReducer, kernel).rename('B2_stdDev');
  var B3mean = image.select('B3').reduceNeighborhood(meanReducer, kernel).rename('B3_mean');
  var B3std = image.select('B3').reduceNeighborhood(stdReducer, kernel).rename('B3_stdDev');
  var B4mean = image.select('B4').reduceNeighborhood(meanReducer, kernel).rename('B4_mean');
  var B4std = image.select('B4').reduceNeighborhood(stdReducer, kernel).rename('B4_stdDev');
  var B5mean = image.select('B5').reduceNeighborhood(meanReducer, kernel).rename('B5_mean');
  var B5std = image.select('B5').reduceNeighborhood(stdReducer, kernel).rename('B5_stdDev');
  var B7mean = image.select('B7').reduceNeighborhood(meanReducer, kernel).rename('B7_mean');
  var B7std = image.select('B7').reduceNeighborhood(stdReducer, kernel).rename('B7_stdDev');
  
  return image
    .addBands(B1mean).addBands(B1std)
    .addBands(B2mean).addBands(B2std)
    .addBands(B3mean).addBands(B3std)
    .addBands(B4mean).addBands(B4std)
    .addBands(B5mean).addBands(B5std)
    .addBands(B7mean).addBands(B7std);
};

/**
 * Extracts second-order GLCM texture (contrast, entropy, correlation).
 * @param {ee.Image} image - Input image.
 * @returns {ee.Image} Image with added GLCM bands.
 */
var addGLCMTexture = function(image) {
  var glcmSize = 3;
  var B1glcm = image.select('B1').glcmTexture({size: glcmSize});
  var B1con = B1glcm.select('B1_contrast').rename('B1_con');
  var B1ent = B1glcm.select('B1_ent').rename('B1_ent');
  var B1cor = B1glcm.select('B1_corr').rename('B1_cor');
  var B2glcm = image.select('B2').glcmTexture({size: glcmSize});
  var B2con = B2glcm.select('B2_contrast').rename('B2_con');
  var B2ent = B2glcm.select('B2_ent').rename('B2_ent');
  var B2cor = B2glcm.select('B2_corr').rename('B2_cor');
  var B3glcm = image.select('B3').glcmTexture({size: glcmSize});
  var B3con = B3glcm.select('B3_contrast').rename('B3_con');
  var B3ent = B3glcm.select('B3_ent').rename('B3_ent');
  var B3cor = B3glcm.select('B3_corr').rename('B3_cor');
  var B4glcm = image.select('B4').glcmTexture({size: glcmSize});
  var B4con = B4glcm.select('B4_contrast').rename('B4_con');
  var B4ent = B4glcm.select('B4_ent').rename('B4_ent');
  var B4cor = B4glcm.select('B4_corr').rename('B4_cor');
  var B5glcm = image.select('B5').glcmTexture({size: glcmSize});
  var B5con = B5glcm.select('B5_contrast').rename('B5_con');
  var B5ent = B5glcm.select('B5_ent').rename('B5_ent');
  var B5cor = B5glcm.select('B5_corr').rename('B5_cor');
  var B7glcm = image.select('B7').glcmTexture({size: glcmSize});
  var B7con = B7glcm.select('B7_contrast').rename('B7_con');
  var B7ent = B7glcm.select('B7_ent').rename('B7_ent');
  var B7cor = B7glcm.select('B7_corr').rename('B7_cor');
  
  return image
    .addBands(B1con).addBands(B1ent).addBands(B1cor)
    .addBands(B2con).addBands(B2ent).addBands(B2cor)
    .addBands(B3con).addBands(B3ent).addBands(B3cor)
    .addBands(B4con).addBands(B4ent).addBands(B4cor)
    .addBands(B5con).addBands(B5ent).addBands(B5cor)
    .addBands(B7con).addBands(B7ent).addBands(B7cor);
};

/**
 * Calculates annual climatic variables for a given year.
 * @param {Number} year - The target year.
 * @returns {ee.Image} An image with annual precipitation, previous year precipitation,
 *                      temperature anomaly, and summer mean temperature.
 */
function getClimateData(year) {
  var start = ee.Date.fromYMD(year, 1, 1);
  var end = start.advance(1, 'year');
  
  // Annual Total Precipitation
  var annualPrecip = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY')
                     .filterDate(start, end)
                     .select('total_precipitation')
                     .sum()
                     .multiply(1000) // Convert to mm
                     .rename('a_precip');
  
  // Previous Year's Total Precipitation
  var prevStart = start.advance(-1, 'year');
  var prevEnd = start;
  var prevPrecip = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY')
                   .filterDate(prevStart, prevEnd)
                   .select('total_precipitation')
                   .sum()
                   .multiply(1000)
                   .rename('p_precip');
  
  // Annual Mean Temperature Anomaly
  var annualTemp = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY')
                   .filterDate(start, end)
                   .select('skin_temperature')
                   .mean()
                   .subtract(273.15)
                   .rename('annual_temp');
  var tempAnomaly = annualTemp.subtract(baselineTemp).rename('temp_an');
  
  // Summer (June-August) Mean Temperature
  var summerStart = ee.Date.fromYMD(year, 6, 1);
  var summerEnd = ee.Date.fromYMD(year, 9, 1); // Exclusive of Sept 1
  var summerTemp = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY')
                  .filterDate(summerStart, summerEnd)
                  .select('skin_temperature')
                  .mean()
                  .subtract(273.15)
                  .rename('su_temp');
  
  return ee.Image.cat([annualPrecip, prevPrecip, tempAnomaly, summerTemp])
                .set('year', year);
}

/**
 * Calculates comprehensive annual features from a time series of index images.
 * @param {ee.ImageCollection} tsCollection - Annual collection of spectral index images.
 * @param {Number} targetYear - The year for which to predict FCL.
 * @param {ee.Geometry} aoi - Area of interest (ecoregion).
 * @param {ee.Image} forestMask - Forest mask to apply.
 * @returns {ee.Image} A multi-band image containing all calculated features.
 */
function calculateAnnualFeatures(tsCollection, targetYear, aoi, forestMask) {
  // Get images for the target and two preceding years.
  var imgTarget = tsCollection.filter(ee.Filter.eq('composite_year', targetYear)).first();
  var imgPrev1 = tsCollection.filter(ee.Filter.eq('composite_year', targetYear - 1)).first();
  var imgPrev2 = tsCollection.filter(ee.Filter.eq('composite_year', targetYear - 2)).first();

  // Historical collections for temporal metrics.
  var histCollection_3y = tsCollection
    .filter(ee.Filter.and(
      ee.Filter.gte('composite_year', targetYear - 3),
      ee.Filter.lte('composite_year', targetYear - 1)
    ))
    .sort('composite_year')
    .map(addYearBand); // Adds a 'year' band for linear regression

  var histCollection_5y = tsCollection
    .filter(ee.Filter.and(
      ee.Filter.gte('composite_year', targetYear - 5),
      ee.Filter.lte('composite_year', targetYear - 1)
    ))
    .sort('composite_year');

  var histCollection = tsCollection
    .filter(ee.Filter.lt('composite_year', targetYear))
    .sort('composite_year')
    .map(addYearBand);

  // Helper: Safe division to avoid division by zero.
  var safeDivide = function(num, denom) {
    return ee.Image(ee.Algorithms.If(
      denom.eq(0),
      ee.Image(0),
      num.divide(denom)
    ));
  };

  // Calculate relative change between consecutive years.
  var chg_ra_target = imgTarget.subtract(imgPrev1)
    .divide(safeDivide(imgPrev1.abs(), imgPrev1.abs().add(1e-5)))
    .select(INDEX_BANDS)
    .rename(CHG_RA_NAMES);

  // Temporal statistics: rolling mean, min, and volatility.
  var rol_3y = histCollection_3y.mean().select(INDEX_BANDS).rename(ROL_3Y_NAMES);
  var rol_5y = histCollection_5y.min().select(INDEX_BANDS).rename(ROL_5Y_NAMES);
  var vola_5y = histCollection_5y.reduce(ee.Reducer.stdDev()).rename(VOLA_5Y_NAMES);
  
  // Long-term and recovery trends via linear regression.
  var fullTrend = calculateTrend(histCollection, 'trend');
  var recoveryTrend = calculateTrend(histCollection_3y, 'reco_s').rename(RECO_S_NAMES);

  // Additional change metrics.
  var an_cha = imgTarget.subtract(imgPrev1).abs()
    .select(INDEX_BANDS)
    .rename(AN_CHA_NAMES);
  var histMean = histCollection.mean()
    .select(INDEX_BANDS)
    .rename(MEAN_NAMES);

  // Combine all features.
  var result = imgTarget
    .select(INDEX_BANDS) // Current year's spectral values
    .addBands(chg_ra_target)
    .addBands(rol_3y).addBands(rol_5y)
    .addBands(fullTrend)
    .addBands(an_cha)
    .addBands(vola_5y)
    .addBands(recoveryTrend)
    .addBands(histMean)
    .clip(aoi)
    .updateMask(forestMask); // Restrict to 2000 forest area
  
  return result.set('target_year', targetYear);

  // --- Internal Helper Functions ---
  function addYearBand(img) {
    var year = ee.Number(img.get('composite_year'));
    var yearImg = ee.Image.constant(year).rename('year').toFloat();
    return img.addBands(yearImg);
  }
  
  function calculateTrend(collection, suffix) {
    var regression = collection
      .select(['year'].concat(INDEX_BANDS))
      .reduce(ee.Reducer.linearRegression({
        numX: 1,
        numY: INDEX_BANDS.length
      }));
    return regression.select('coefficients')
      .arrayProject([0])
      .arrayFlatten([INDEX_BANDS])
      .select(INDEX_BANDS)
      .rename(INDEX_BANDS.map(function(b) { return b + '_' + suffix; }));
  }
}

// -------------------------------
// 6. TERRAIN FEATURE PROCESSING
// -------------------------------

/**
 * Converts degrees to radians for terrain calculations.
 * @param {ee.Image} img - Image with values in degrees.
 * @returns {ee.Image} Image with values in radians.
 */
function radians(img) {
  return img.toFloat().multiply(Math.PI).divide(180);
}

// Calculate slope and aspect, then convert to radians.
var terrain = ee.Algorithms.Terrain(srtm);
var slope = radians(terrain.select('slope'));
var aspect = radians(terrain.select('aspect'));

// Combine into a single terrain image.
var terrainFeatures = ee.Image.cat([
  srtm.select(['elevation'], ['dem']),
  slope.select(['slope'], ['slope']),
  aspect.select(['aspect'], ['aspect'])
]).clip(china); // Clip to China for efficiency.

// -------------------------------
// 7. MAIN PROCESSING PIPELINE
// -------------------------------

print('Starting main processing pipeline...');

// 7.1 Build Annual Landsat SR Collection
var START_YEAR = 2000;
var START_DAY = '05-01';
var END_DAY = '09-30';
var MASK_THESE = ['cloud', 'shadow', 'snow'];

var srCollection = ltgee.buildSRcollection(
  START_YEAR, TARGET_YEAR, START_DAY, END_DAY, aoi, MASK_THESE);
print('Landsat annual composite collection built.');

// 7.2 Calculate Spectral Indices & Temporal Features
var tsCollection = srCollection.map(addIndices).select(INDEX_BANDS);
var annualFeatures = calculateAnnualFeatures(tsCollection, TARGET_YEAR, aoi, forestMask);
print('Annual spectral-temporal features calculated.');

// 7.3 Extract Textural Features for the Target Year
var imgTarget = srCollection.filter(ee.Filter.eq('composite_year', TARGET_YEAR)).first();
var textureFeatures1 = addFirstOrderTexture(imgTarget);
var textureFeatures2 = addGLCMTexture(imgTarget);
print('Spatial textural features calculated.');

// 7.4 Get Annual Climate Data
var climateData = getClimateData(TARGET_YEAR).clip(aoi);
print('Annual climate data retrieved.');

// 7.5 Combine ALL Features and Select Optimal Subset
var fullFeatureImage = annualFeatures
  .addBands(textureFeatures1)
  .addBands(textureFeatures2)
  .addBands(climateData)
  .addBands(terrainFeatures);

var selectedFeatures = fullFeatureImage.select(optimalFeatures);
print('Final feature image created with selected optimal bands.');
print('Available bands for classification:', selectedFeatures.bandNames());

// -------------------------------
// 8. CLASSIFICATION & POST-PROCESSING
// -------------------------------

print('Loading classifier and performing classification...');
// 8.1 Load the pre-trained ecoregion-optimized model.
var model = ee.Classifier.load(modelPath);

// 8.2 Classify the feature image.
var classified = selectedFeatures.classify(model, 'prediction').updateMask(forestMask);

// 8.3 Apply post-processing: focal smoothing (3x3 mode filter).
var smoothed = classified.focal_mode({radius: 1, kernelType: 'square', iterations: 1});
print('Classification and smoothing completed.');

// -------------------------------
// 9. EXPORT RESULTS
// -------------------------------

var exportDescription = 'FCL_Map_' + TARGET_YEAR + '_Ecoregion_' + ECOREGION_ID;
print('Preparing export task:', exportDescription);

Export.image.toDrive({
  image: smoothed,
  description: exportDescription,
  folder: 'GEE_FCL_Exports', // Specify your Google Drive folder
  fileNamePrefix: exportDescription,
  region: aoi,
  scale: 30, // Landsat resolution
  maxPixels: 1e13,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  formatOptions: {
    cloudOptimized: true
  }
});

// -------------------------------
// 10. VISUALIZATION (Optional)
// -------------------------------

// Center the map on the ecoregion and add the result layer.
Map.centerObject(aoi, 8);
Map.addLayer(smoothed, {
  min: 0,
  max: 3, // Assuming 0:Stable, 1-3: FCL types/severity
  palette: ['darkgreen', 'yellow', 'red', 'orange'] // Adjust palette to your class scheme
}, 'Smoothed FCL Classification');

print('===================================');
print('Processing finished successfully.');
print('Please run the export task from the "Tasks" tab.');
print('===================================');
