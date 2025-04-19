export type ViewMode = 'beats' | 'script' | 'boards';
export type SidebarTab = 'scenes' | 'comments' | 'notes' | 'inputs';

export interface TitlePage {
  title: string;
  author: string;
  contact: string;
  date: string;
  draft: string;
  copyright: string;
  coverImage?: string;
}

export type ElementType = 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';
export type AIActionType = 'expand' | 'shorten' | 'rewrite' | 'continue';


export interface Comment {
  id: string;
  text: string;
  from: number;
  to: number;
  createdAt: string;
}

export interface ScriptElement {
  segmentPosition?: number;
  id: string;            // Frontend ID for React keys
  type: ElementType;
  content: string;
  comments?: Comment[];
  sceneSegmentId?: string; // Added to track which scene segment this element belongs to
  position?: number;
  componentId: string; // Original backend component ID
  isNew?: boolean;
}

export interface ElementFormat {
  alignment: 'left' | 'center' | 'right';
  width: number; // Now in inches instead of percentage
  spacingBefore: number;
  spacingAfter: number;
}

export interface PageLayout {
  paperSize: 'letter' | 'a4' | 'legal' | 'custom';
  width: number; // in inches
  height: number; // in inches
  marginTop: number; // in inches
  marginBottom: number; // in inches
  marginLeft: number; // in inches
  marginRight: number; // in inches
  showPageNumbers: boolean;
  pageNumberPosition: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

export interface FormatSettings {
  preset: 'standard' | 'compact' | 'custom';
  elements: {
    'scene-heading': ElementFormat;
    'action': ElementFormat;
    'character': ElementFormat;
    'parenthetical': ElementFormat;
    'dialogue': ElementFormat;
    'transition': ElementFormat;
  };
  pageLayout: PageLayout;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: 'free' | 'premium' | 'admin';
  createdAt: string;
  lastLogin?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    autoSave: boolean;
    formatSettings: FormatSettings;
  };
}

// Define script creation modes to match backend enum
export type ScriptCreationMethod = 
  | 'FROM_SCRATCH'  // Manual creation
  | 'WITH_AI'       // AI-assisted creation
  | 'UPLOAD';       // Imported from file

// Map frontend-friendly names to backend enum values
const CREATION_METHOD_MAP = {
  manual: 'FROM_SCRATCH' as ScriptCreationMethod,
  ai: 'WITH_AI' as ScriptCreationMethod,
  upload: 'UPLOAD' as ScriptCreationMethod
};

// Define script states for state machine
export type ScriptState = 
  | 'empty'                // No content yet
  | 'beatsLoaded'          // Beats generated but no scenes
  | 'firstSceneGenerated'  // First scene has been generated
  | 'multipleScenes'       // Multiple scenes exist
  | 'uploaded'             // Script was uploaded from file
  | 'complete';            // Script is complete

// Interface for script metadata
export interface ScriptMetadata {
  id: string;
  title: string;
  creationMethod: ScriptCreationMethod;
  createdAt: string;
  updatedAt: string;
  isAiGenerated: boolean;
  isUploaded?: boolean;
  currentSceneSegmentId?: string;
  uploadedFileType?: 'pdf' | 'fdx'; // Track uploaded file type if applicable
}

// Interface for script state context
export interface ScriptStateContext {
  scriptId: string;
  creationMethod: ScriptCreationMethod;
  hasBeats: boolean;
  scenesCount: number;
  isComplete: boolean;
  currentSceneSegmentId?: string; // Use undefined instead of null
  uploadInfo?: {
    fileType: string;
    fileName: string;
    uploadDate: string;
  };
}

// Interface for state machine actions
export interface ScriptStateActions {
  generateBeats: () => Promise<void>;
  generateFirstScene: () => Promise<void>; // Changed to return void
  generateNextScene: () => Promise<void>;  // Changed to return void
  markComplete: () => void;
  processUploadedScript: (file: File) => Promise<void>;
}


// Interface for script state machine returned values
export interface ScriptStateValues {
  state: ScriptState;
  context: ScriptStateContext;
  actions: ScriptStateActions;
  
  // Derived UI state flags
  showGenerateBeatsButton: boolean;
  showGenerateScriptButton: boolean;
  showGenerateNextSceneButton: boolean;
  canEditBeats: boolean;
  canEditScript: boolean;
  isUploadedScript: boolean;
  canReprocessUpload: boolean;
}

export const DEFAULT_FORMAT_SETTINGS: FormatSettings = {
  preset: 'standard',
  elements: {
    'scene-heading': { alignment: 'left', width: 6, spacingBefore: 1.5, spacingAfter: 1 },
    'action': { alignment: 'left', width: 6, spacingBefore: 0, spacingAfter: 1 },
    'character': { alignment: 'center', width: 3.5, spacingBefore: 1, spacingAfter: 0.25 },
    'parenthetical': { alignment: 'center', width: 2.5, spacingBefore: 0, spacingAfter: 0 },
    'dialogue': { alignment: 'left', width: 3.5, spacingBefore: 0, spacingAfter: 1 },
    'transition': { alignment: 'right', width: 6, spacingBefore: 1, spacingAfter: 1 }
  },
  pageLayout: {
    paperSize: 'letter',
    width: 8.5,
    height: 11,
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 1.5,
    marginRight: 1,
    showPageNumbers: true,
    pageNumberPosition: 'top-right'
  }
};

export interface SceneSuggestions {
  locations: {
    INT: string[];
    EXT: string[];
  };
  times: string[];
  transitions: string[];
  characters: string[];
  parentheticals: string[];
  dialogues: {
    openers: string[];
    responses: string[];
    emotions: string[];
  };
}

export interface IdMappings {
  segments: Record<string, string>; // Maps frontend temp ID to backend UUID
  components: Record<string, string>; // Maps frontend temp ID to backend UUID
}

export interface ScriptChangesResponse {
  success: boolean;
  message: string;
  updated_components: number;
  deleted_components: number;
  deleted_segments: number;
  created_segments: number;
  created_components: number;
  idMappings: IdMappings;
}

export enum ComponentTypeFE {
  HEADING = "HEADING",
  ACTION = "ACTION",
  DIALOGUE = "DIALOGUE",
  CHARACTER = "CHARACTER",
  TRANSITION = "TRANSITION",
  PARENTHETICAL = "PARENTHETICAL"
}

// Define types for payload based on provided schema
export interface ComponentChange {
  id: string; // UUID4 in backend, string here
  component_type: ComponentTypeFE;
  position: number;
  content: string;
  character_name?: string;
  parenthetical?: string;
}

export interface NewComponentForSegment {
  component_type: ComponentTypeFE;
  position: number;
  content: string;
  character_name?: string;
  parenthetical?: string;
  frontendId: string;
}

export interface NewSegment {
  segmentNumber: number;
  frontendId: string;
  components: NewComponentForSegment[];
}

export interface NewComponentForExistingSegment {
  segment_id: string; // UUID4 in backend, string here
  component_type: ComponentTypeFE;
  position: number;
  content: string;
  character_name?: string;
  parenthetical?: string;
  frontendId: string;
}

export interface ScriptChangesRequest {
  changedSegments: Record<string, ComponentChange[]>;
  deletedElements: string[]; // UUID4[] in backend
  deletedSegments: string[]; // UUID4[] in backend
  newSegments: NewSegment[];
  newComponentsInExistingSegments: NewComponentForExistingSegment[];
}

// Default suggestions
export const DEFAULT_SUGGESTIONS: SceneSuggestions = {
  locations: {
    INT: [
      'LIVING ROOM',
      'BEDROOM',
      'KITCHEN',
      'OFFICE',
      'HALLWAY',
      'BATHROOM',
      'DINING ROOM',
      'BASEMENT',
      'ATTIC',
      'GARAGE',
      'ELEVATOR',
      'APARTMENT',
      'CLASSROOM',
      'RESTAURANT',
      'BAR',
      'HOSPITAL ROOM'
    ],
    EXT: [
      'STREET',
      'PARK',
      'BEACH',
      'BACKYARD',
      'PARKING LOT',
      'FOREST',
      'GARDEN',
      'PATIO',
      'PLAYGROUND',
      'ROOFTOP',
      'SIDEWALK',
      'ALLEY',
      'HIGHWAY',
      'CITY STREET',
      'COURTYARD',
      'POOL'
    ]
  },
  times: [
    'DAY',
    'NIGHT',
    'MORNING',
    'EVENING',
    'DAWN',
    'DUSK',
    'SUNSET',
    'SUNRISE',
    'AFTERNOON',
    'CONTINUOUS',
    'LATER',
    'MOMENTS LATER',
    'SAME TIME',
    'MAGIC HOUR',
    'GOLDEN HOUR',
    'MIDNIGHT'
  ],
  transitions: [
    'CUT TO:',
    'FADE OUT.',
    'FADE IN:',
    'DISSOLVE TO:',
    'SMASH CUT TO:',
    'MATCH CUT TO:',
    'JUMP CUT TO:',
    'FADE TO BLACK.',
    'QUICK CUT TO:',
    'TIME CUT:',
    'FLASH CUT TO:',
    'SLOW FADE TO:',
    'MATCH DISSOLVE TO:',
    'IRIS IN:',
    'IRIS OUT.',
    'WIPE TO:'
  ],
  characters: [],
  parentheticals: [
    '(beat)',
    '(pause)',
    '(quietly)',
    '(angry)',
    '(laughing)',
    '(whispering)',
    '(sarcastically)',
    '(emotional)',
    '(under breath)',
    '(excited)',
    '(nervous)',
    '(stern)',
    '(smiling)',
    '(concerned)',
    '(confused)',
    '(frustrated)'
  ],
  dialogues: {
    openers: [
      'Listen,',
      'Look,',
      'I mean,',
      'The thing is,',
      'You know what?',
      'Here\'s the deal:',
      'Honestly,',
      'Truth is,',
      'Let me tell you something:',
      'I\'ve been thinking...'
    ],
    responses: [
      'I understand.',
      'Maybe you\'re right.',
      'That\'s not what I meant.',
      'Fair enough.',
      'You have a point.',
      'I disagree.',
      'That\'s interesting.',
      'I never thought of that.',
      'Is that so?',
      'Tell me more.'
    ],
    emotions: [
      'I can\'t believe this!',
      'This is amazing!',
      'I\'m so sorry...',
      'That\'s terrible.',
      'How could you?',
      'I love this!',
      'This is ridiculous.',
      'You\'re kidding, right?',
      'I\'m speechless.',
      'This changes everything.'
    ]
  }
};

export const DEFAULT_USER_PROFILES: UserProfile[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    bio: 'Screenwriter and director with a passion for sci-fi and drama.',
    role: 'premium',
    createdAt: '2023-01-15T10:30:00Z',
    lastLogin: '2023-06-20T14:45:00Z',
    preferences: {
      theme: 'dark',
      fontSize: 14,
      autoSave: true,
      formatSettings: DEFAULT_FORMAT_SETTINGS
    }
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    bio: 'Award-winning screenwriter specializing in comedy and drama.',
    role: 'premium',
    createdAt: '2023-02-10T09:15:00Z',
    lastLogin: '2023-06-19T16:30:00Z',
    preferences: {
      theme: 'light',
      fontSize: 16,
      autoSave: true,
      formatSettings: {
        ...DEFAULT_FORMAT_SETTINGS,
        preset: 'compact'
      }
    }
  },
  {
    id: 'user3',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    bio: 'Aspiring screenwriter working on my first feature film.',
    role: 'free',
    createdAt: '2023-03-05T11:45:00Z',
    lastLogin: '2023-06-18T10:20:00Z',
    preferences: {
      theme: 'system',
      fontSize: 14,
      autoSave: false,
      formatSettings: DEFAULT_FORMAT_SETTINGS
    }
  }
];

export const getNextElementType = (currentType: ElementType): ElementType => {
  switch (currentType) {
    case 'scene-heading':
      return 'action';
    case 'action':
      return 'character';
    case 'character':
      return 'dialogue';
    case 'dialogue':
      return 'character';
    case 'parenthetical':
      return 'dialogue';
    case 'transition':
      return 'scene-heading';
    default:
      return 'action';
  }
};

export const parseSceneHeading = (text: string): Partial<SceneLocation> => {
  const parts = text.trim().toUpperCase().split(' - ');
  const locationParts = parts[0]?.split(' ');
  
  if (!locationParts?.length) return {};

  const type = locationParts[0] === 'INT.' || locationParts[0] === 'INT' ? 'INT' :
               locationParts[0] === 'EXT.' || locationParts[0] === 'EXT' ? 'EXT' : undefined;
               
  if (!type) return {};

  const location = locationParts.slice(1).join(' ').trim();
  const time = parts[1]?.trim();

  return {
    type,
    location: location || undefined,
    time: time || undefined
  };
};

interface SceneLocation {
  type: 'INT' | 'EXT';
  location: string;
  time?: string;
}