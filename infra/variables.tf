variable "region" {
  description = "AWS region."
  type        = string
  default     = "ap-southeast-1"
}

variable "app_name" {
  description = "Base name used to derive resource names."
  type        = string
  default     = "test-automation-showcase"
}

variable "container_image" {
  description = "Container image for the API task. Defaults to a public placeholder for the first infra-only apply; the deploy workflow points it at the ECR image on each release."
  type        = string
  default     = "public.ecr.aws/nginx/nginx:stable"
}

variable "desired_count" {
  description = "Number of ECS tasks to run."
  type        = number
  default     = 1
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the ALB. When set, an HTTPS:443 listener is added and HTTP:80 redirects to it; when empty, the ALB serves HTTP:80 only (suitable only for demos / non-sensitive traffic)."
  type        = string
  default     = ""
}
