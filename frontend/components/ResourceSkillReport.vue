<template>
  <div class="resource-skill-report">
    <v-card flat>
      <v-card-title>
        Skills Report
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search skills"
          single-line
          hide-details
          class="mx-4"
        ></v-text-field>
        <v-select
          v-model="reportType"
          :items="reportTypeOptions"
          label="Report Type"
          dense
          outlined
          class="skill-report-select"
        ></v-select>
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          v-if="reportType === 'table'"
          :headers="reportHeaders"
          :items="reportData"
          :search="search"
          :loading="loading"
          class="elevation-1"
          :items-per-page="10"
        >
          <!-- Skill level column -->
          <template v-slot:[`item.avgProficiency`]="{ item }">
            <v-rating
              :value="item.avgProficiency"
              color="amber"
              dense
              half-increments
              readonly
              size="14"
            ></v-rating>
            <span class="ml-1">{{ item.avgProficiency.toFixed(1) }}</span>
          </template>
        </v-data-table>
        
        <div v-else-if="reportType === 'heatmap'" class="skills-heatmap mt-4">
          <h3>Skills Heat Map</h3>
          <div class="heatmap-legend d-flex justify-center my-3">
            <div class="d-flex align-center">
              <div class="heat-level heat-level-0 mr-1"></div>
              <span class="caption mr-4">No skill</span>
              
              <div class="heat-level heat-level-1 mr-1"></div>
              <span class="caption mr-4">Beginner</span>
              
              <div class="heat-level heat-level-2 mr-1"></div>
              <span class="caption mr-4">Intermediate</span>
              
              <div class="heat-level heat-level-3 mr-1"></div>
              <span class="caption mr-4">Advanced</span>
              
              <div class="heat-level heat-level-4 mr-1"></div>
              <span class="caption mr-4">Expert</span>
              
              <div class="heat-level heat-level-5 mr-1"></div>
              <span class="caption">Master</span>
            </div>
          </div>
          
          <div class="heatmap-container">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th class="resource-col">Resource</th>
                  <th v-for="skill in filteredSkillsList" :key="skill" class="skill-col">
                    {{ skill }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="resource in resources" :key="resource.id">
                  <td class="resource-name">{{ resource.fullName }}</td>
                  <td 
                    v-for="skill in filteredSkillsList" 
                    :key="`${resource.id}-${skill}`"
                    :class="getHeatmapCellClass(resource, skill)"
                    class="skill-cell"
                    :title="`${resource.fullName}: ${skill} - ${getResourceSkillLevelText(resource, skill)}`"
                  ></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { resourceService } from '@/services';

export default {
  name: 'ResourceSkillReport',
  
  props: {
    resources: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      search: '',
      reportType: 'heatmap',
      reportTypeOptions: [
        { text: 'Skill Table', value: 'table' },
        { text: 'Skill Heat Map', value: 'heatmap' }
      ],
      reportHeaders: [
        { text: 'Skill', value: 'name' },
        { text: 'Resources with Skill', value: 'resourceCount' },
        { text: 'Avg. Proficiency', value: 'avgProficiency' },
        { text: 'Department Distribution', value: 'departmentDistribution' }
      ],
      skillLevelTexts: ['Not Rated', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'],
      reportData: []
    };
  },
  
  computed: {
    filteredSkillsList() {
      const skills = this.getAllSkills();
      if (this.search) {
        const search = this.search.toLowerCase();
        return skills.filter(skill => skill.toLowerCase().includes(search));
      }
      return skills;
    }
  },
  
  watch: {
    resources: {
      handler() {
        this.generateReport();
      },
      immediate: true
    }
  },
  
  methods: {
    // Generate skill report data
    generateReport() {
      const skillsData = {};
      const allSkills = this.getAllSkills();
      
      // Initialize data structure
      allSkills.forEach(skill => {
        skillsData[skill] = {
          name: skill,
          resourceCount: 0,
          proficiencySum: 0,
          departments: {}
        };
      });
      
      // Populate with resource data
      this.resources.forEach(resource => {
        if (resource.skills && Array.isArray(resource.skills)) {
          resource.skills.forEach(skill => {
            let skillName, skillLevel;
            
            if (typeof skill === 'string') {
              skillName = skill;
              skillLevel = 3; // Default level
            } else if (skill && skill.name) {
              skillName = skill.name;
              skillLevel = skill.level || 3;
            } else {
              return; // Skip invalid skills
            }
            
            if (skillsData[skillName]) {
              skillsData[skillName].resourceCount++;
              skillsData[skillName].proficiencySum += skillLevel;
              
              // Track department distribution
              const dept = resource.department || 'Unassigned';
              if (!skillsData[skillName].departments[dept]) {
                skillsData[skillName].departments[dept] = 0;
              }
              skillsData[skillName].departments[dept]++;
            }
          });
        }
      });
      
      // Format data for display
      this.reportData = Object.values(skillsData).map(skill => ({
        name: skill.name,
        resourceCount: skill.resourceCount,
        avgProficiency: skill.resourceCount > 0 ? skill.proficiencySum / skill.resourceCount : 0,
        departmentDistribution: Object.entries(skill.departments)
          .map(([dept, count]) => `${dept}: ${count}`)
          .join(', ')
      }));
    },
    
    // Get all unique skills across all resources
    getAllSkills() {
      const skillSet = new Set();
      this.resources.forEach(resource => {
        if (resource.skills && Array.isArray(resource.skills)) {
          resource.skills.forEach(skill => {
            if (typeof skill === 'string') {
              skillSet.add(skill);
            } else if (skill && skill.name) {
              skillSet.add(skill.name);
            }
          });
        }
      });
      return Array.from(skillSet).sort();
    },
    
    // Get heatmap cell class based on skill level
    getHeatmapCellClass(resource, skillName) {
      const level = this.getResourceSkillLevel(resource, skillName);
      return `heat-level-${level}`;
    },
    
    // Get a resource's skill level for a specific skill
    getResourceSkillLevel(resource, skillName) {
      if (!resource.skills) return 0;
      
      const skill = resource.skills.find(s => {
        if (typeof s === 'string') {
          return s === skillName;
        } else {
          return s.name === skillName;
        }
      });
      
      if (!skill) return 0;
      
      return typeof skill === 'string' ? 3 : (skill.level || 3);
    },
    
    // Get text description of skill level
    getResourceSkillLevelText(resource, skillName) {
      const level = this.getResourceSkillLevel(resource, skillName);
      return level === 0 ? 'Not skilled' : this.skillLevelTexts[level];
    },
    
    // Export the skill report data to CSV
    exportReport() {
      const headers = ['Skill', 'Resources with Skill', 'Avg. Proficiency', 'Department Distribution'];
      const csvContent = [
        headers.join(','),
        ...this.reportData.map(item => [
          item.name,
          item.resourceCount,
          item.avgProficiency.toFixed(1),
          `"${item.departmentDistribution}"` // Wrap with quotes to handle commas
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'skill_report.csv');
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
</script>

<style scoped>
.skills-heatmap {
  overflow-x: auto;
}

.heatmap-table {
  border-collapse: collapse;
  min-width: 100%;
}

.heatmap-table th,
.heatmap-table td {
  border: 1px solid #eee;
  padding: 8px;
  text-align: center;
}

.resource-col {
  min-width: 150px;
  position: sticky;
  left: 0;
  background: white;
  z-index: 1;
}

.resource-name {
  position: sticky;
  left: 0;
  background: white;
  text-align: left;
  z-index: 1;
}

.skill-col {
  min-width: 120px;
  white-space: nowrap;
  transform: rotate(-45deg);
  height: 80px;
  vertical-align: bottom;
  padding-bottom: 20px;
}

.skill-cell {
  width: 40px;
  height: 40px;
}

.heat-level {
  width: 20px;
  height: 20px;
  border-radius: 2px;
}

.heat-level-0 {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
}

.heat-level-1 {
  background-color: #d4eaff;
}

.heat-level-2 {
  background-color: #77c2ff;
}

.heat-level-3 {
  background-color: #0095ff;
}

.heat-level-4 {
  background-color: #0055b3;
}

.heat-level-5 {
  background-color: #00317a;
}

.skill-report-select {
  max-width: 200px;
}
</style> 