library(tidyverse)
data <- read.csv("data/Sleep_Efficiency.csv")

filtered_data <-
  data %>%
  filter(!is.na(Caffeine.consumption) & !is.na(Alcohol.consumption) & !is.na(Exercise.frequency))

filtered_data <-
filtered_data %>%
  mutate(time=format(as.POSIXct(filtered_data$Bedtime, format="%Y-%m-%d %H:%M"), format="%H:%M"))

filtered_data <- filtered_data %>%
  rename("id" = "ID",
         "age" = "Age",
         "gender" = "Gender",
         "bedtime" = "Bedtime",
         "wakeupTime" = "Wakeup.time",
         "sleepDuration" = "Sleep.duration",
         "sleepEfficiency" = "Sleep.efficiency",
         "REMSleepPercentage" = "REM.sleep.percentage",
         "deepSleepPercentage" = "Deep.sleep.percentage",
         "lightSleepPercentage" = "Light.sleep.percentage",
         "awakenings" = "Awakenings",
         "caffeineConsumption" = "Caffeine.consumption",
         "alcoholConsumption" = "Alcohol.consumption",
         "smokingStatus" = "Smoking.status",
         "exerciseFrequency" = "Exercise.frequency")

write.csv(filtered_data, "data/Sleep_Efficiency_preprocessed.csv", row.names=FALSE)

