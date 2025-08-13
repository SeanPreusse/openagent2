import { ButtonVariantType } from '@/components/ui/Button'

export const backendBaseUrl = ''
export const webuiPrefix = '/webui/'

export const controlButtonVariant: ButtonVariantType = 'ghost'

export const labelColorDarkTheme = '#B2EBF2'
export const LabelColorHighlightedDarkTheme = '#000'

export const nodeColorDisabled = '#E2E2E2'
export const nodeBorderColor = '#EEEEEE'
export const nodeBorderColorSelected = '#F57F17'

export const edgeColorDarkTheme = '#969696'
export const edgeColorSelected = '#F57F17'
export const edgeColorHighlighted = '#B2EBF2'

export const searchResultLimit = 50
export const labelListLimit = 100

export const minNodeSize = 4
export const maxNodeSize = 20

export const healthCheckInterval = 15 // seconds

export const defaultQueryLabel = '*'

// reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types
export const supportedFileTypes = {
  // Text and markup files
  'text/plain': [
    '.txt',
    '.md',
    '.html',
    '.htm',
    '.tex',
    '.json',
    '.xml',
    '.yaml',
    '.yml',
    '.rtf',
    '.odt',
    '.epub',
    '.csv',
    '.log',
    '.conf',
    '.ini',
    '.properties',
    '.sql',
    '.bat',
    '.sh',
    '.c',
    '.cpp',
    '.py',
    '.java',
    '.js',
    '.ts',
    '.swift',
    '.go',
    '.rb',
    '.php',
    '.css',
    '.scss',
    '.less'
  ],
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  // Images - Multimodal support
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff', '.tif'],
  'image/svg+xml': ['.svg']
}

export const SiteInfo = {
  name: 'LightRAG',
  home: '/',
  github: 'https://github.com/HKUDS/LightRAG'
}
