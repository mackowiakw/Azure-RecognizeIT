terraform {
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "psr_proj_rg" {
  name     = "psr-proj-rg"
  location = "West Europe"
}

resource "azurerm_cognitive_account" "psr_proj_comp_vis" {
  name                = "psr-proj-comp-vis"
  resource_group_name = azurerm_resource_group.psr_proj_rg.name
  location            = azurerm_resource_group.psr_proj_rg.location
  kind                = "ComputerVision"
  sku_name            = "F0"
}

resource "azurerm_storage_account" "psr_proj_queue_storage_acc" {
  name                     = "psrprojqueuestorageacc"
  resource_group_name      = azurerm_resource_group.psr_proj_rg.name
  location                 = azurerm_resource_group.psr_proj_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_queue" "psr_proj_notification_queue" {
  name                 = "notifications"
  storage_account_name = azurerm_storage_account.psr_proj_queue_storage_acc.name
}

resource "azurerm_storage_queue" "psr_proj_process_queue" {
  name                 = "process-tasks"
  storage_account_name = azurerm_storage_account.psr_proj_queue_storage_acc.name
}

resource "azurerm_storage_account" "psr_proj_function_storage_acc" {
  name                     = "psrprojfuncstorageacc"
  resource_group_name      = azurerm_resource_group.psr_proj_rg.name
  location                 = azurerm_resource_group.psr_proj_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_account" "psr_proj_blob_storage_acc" {
  name                     = "psrprojblobstorageacc"
  resource_group_name      = azurerm_resource_group.psr_proj_rg.name
  location                 = azurerm_resource_group.psr_proj_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "psr_proj_photos_storage_container" {
  name                  = "photos"
  storage_account_name  = azurerm_storage_account.psr_proj_blob_storage_acc.name
  container_access_type = "private"
}

resource "azurerm_service_plan" "psr_proj_sp" {
  name                = "psr-proj-sp"
  resource_group_name = azurerm_resource_group.psr_proj_rg.name
  location            = azurerm_resource_group.psr_proj_rg.location
  os_type             = "Linux"
  sku_name            = "Y1"
}

resource "azurerm_application_insights" "psr_proj_ai" {
  name                = "psr-proj-appinsights"
  location            = azurerm_resource_group.psr_proj_rg.location
  resource_group_name = azurerm_resource_group.psr_proj_rg.name
  application_type    = "web"
}

resource "azurerm_linux_function_app" "psr_proj_function_app" {
  name                = "psr-proj-function-app"
  resource_group_name = azurerm_resource_group.psr_proj_rg.name
  location            = azurerm_resource_group.psr_proj_rg.location

  storage_account_name       = azurerm_storage_account.psr_proj_function_storage_acc.name
  storage_account_access_key = azurerm_storage_account.psr_proj_function_storage_acc.primary_access_key
  service_plan_id            = azurerm_service_plan.psr_proj_sp.id

  site_config {
    application_stack {
      node_version = "18"
    }
    cors {
      allowed_origins = ["*"]
    }
    application_insights_key               = azurerm_application_insights.psr_proj_ai.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.psr_proj_ai.connection_string
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"                    = "node"
    "PSR_STORAGE_ACCOUNT_NAME"                    = azurerm_storage_account.psr_proj_blob_storage_acc.name
    "PSR_STORAGE_ACCOUNT_ACCESS_KEY"              = azurerm_storage_account.psr_proj_blob_storage_acc.primary_access_key
    "PSR_STORAGE_ACCOUNT_CONNECTION_STRING"       = azurerm_storage_account.psr_proj_blob_storage_acc.primary_connection_string
    "PSR_STORAGE_ACCOUNT_CONTAINER_NAME"          = azurerm_storage_container.psr_proj_photos_storage_container.name
    "AzureWebJobsStorage"                         = azurerm_storage_account.psr_proj_blob_storage_acc.primary_connection_string
    "PSR_COMPUTER_VISION_KEY"                     = azurerm_cognitive_account.psr_proj_comp_vis.primary_access_key
    "PSR_COMPUTER_VISION_ENDPOINT"                = azurerm_cognitive_account.psr_proj_comp_vis.endpoint
    "AzureQueueStorageConnectionString"           = azurerm_storage_account.psr_proj_queue_storage_acc.primary_connection_string
    "PSR_STORAGE_ACCOUNT_NOTIFICATION_QUEUE_NAME" = azurerm_storage_queue.psr_proj_notification_queue.name
    "PSR_STORAGE_ACCOUNT_PROCESS_QUEUE_NAME"      = azurerm_storage_queue.psr_proj_process_queue.name
    "PSR_STORAGE_ACCOUNT_DB_CONNECTION_STRING"    = azurerm_storage_account.psr_proj_db_storage_acc.primary_connection_string
    "PSR_STORAGE_ACCOUNT_DB_TABLE_NAME"           = azurerm_storage_table.psr_proj_notification_tasks_table.name
    "PSR_COMMUNICATION_SERVICE_CONNECTION_STRING" = azurerm_communication_service.psr_proj_comm_service.primary_connection_string
    "PSR_EMAIL_COMMUNICATION_SERVICE_NAME"        = azurerm_email_communication_service.psr_proj_email_comm_service.name
  }
}

resource "azurerm_storage_account" "psr_proj_db_storage_acc" {
  name                     = "psrprojdbstorageacc"
  resource_group_name      = azurerm_resource_group.psr_proj_rg.name
  location                 = azurerm_resource_group.psr_proj_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_table" "psr_proj_notification_tasks_table" {
  name                 = "notificationTasks"
  storage_account_name = azurerm_storage_account.psr_proj_db_storage_acc.name
}

resource "azurerm_email_communication_service" "psr_proj_email_comm_service" {
  name                = "psr-proj-emailcommunicationservice"
  resource_group_name = azurerm_resource_group.psr_proj_rg.name
  data_location       = "Europe"
}

resource "azurerm_communication_service" "psr_proj_comm_service" {
  name                = "psr-proj-comm-service"
  resource_group_name = azurerm_resource_group.psr_proj_rg.name
  data_location       = "Europe"
}

resource "azurerm_static_site" "psr_proj_site" {
  name                = "psr-proj-static-site"
  resource_group_name = azurerm_resource_group.psr_proj_rg.name
  location            = "West Europe"
}

output "computer_vision_endpoint" {
  value = azurerm_cognitive_account.psr_proj_comp_vis.endpoint
}
