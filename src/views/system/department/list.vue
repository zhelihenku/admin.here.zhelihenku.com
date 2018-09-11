<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input placeholder="关键字" v-model="searchInfo.title" style="width: 200px;" class="filter-item"/>
      <el-select v-model="searchInfo.status" placeholder="请选择视频状态" clearable class="filter-item" style="width: 150px">
        <el-option v-for="item in SystemDepartmentStatusOptions" :key="item.value" :label="item.name" :value="item.value"/>
      </el-select>
      <el-button class="filter-item" type="primary" icon="el-icon-search" @click="loadSystemDepartmentList">搜索</el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreateButton">添加</el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="Loading"
      border
      fit
      highlight-current-row>
      <el-table-column type="index" width="50" align="center">
      </el-table-column>
      <el-table-column label="部门名称" prop="name"  align="center">
      </el-table-column>
      <el-table-column label="部门全称" prop="fullName" align="center">
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="180" align="center">
      </el-table-column>
      <el-table-column label="操作" width="350" align="center">
        <template slot-scope="scope" class="changeType">
          <el-button-group>
            <el-button type="primary" size="mini" @click="handleSeeButton(scope.row)">查看</el-button>
            <el-button type="success" size="mini" @click="handleEditButton(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDeleteButton(scope.row)">删除</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
    <div class="block">
      <el-pagination background @size-change="handlePageSizeChange" @current-change="handlePageCurrentChange" :current-page="currentPage" :page-sizes="pageSizes" :page-size="pageSize" layout="sizes, total, prev, pager, next" :total="totalCount">
      </el-pagination>
    </div>

    <!-- 新增&编辑 -->
    <el-dialog title="部门" :visible.sync="dialogAddAndEditVisible">
      <el-form ref="addAndEditForm" :rules="rules" :model="systemDepartment" label-position="left" label-width="80px" style="width: 400px; margin-left:50px;">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="systemDepartment.name"/>
        </el-form-item>
        <el-form-item label="上级部门" >
          <el-cascader :options="deptTreeList" :props="defaultProps" v-model="selectedParentDeptIds" placeholder="请选择上级部门" change-on-select clearable></el-cascader>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="systemDepartment.desc"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogAddAndEditVisible = false">取消</el-button>
        <el-button v-if="isAddDialog" type="primary" @click="postAddOrEditSystemDepartment">添加</el-button>
        <el-button v-else type="primary" @click="postAddOrEditSystemDepartment">编辑</el-button>
      </div>
    </el-dialog>
    <!-- 新增&编辑 -->

    <!-- 查看 -->
    <el-dialog title="部门" :visible.sync="dialogDetailVisible">
      <el-form ref="dataForm" :model="systemDepartment" label-position="left" label-width="90px" style="width: 400px; margin-left:150px;">
        <el-form-item label="部门名称">
          <el-input v-model="systemDepartment.name" :disabled="true"/>
        </el-form-item>
        <el-form-item label="部门全称">
          <el-input v-model="systemDepartment.fullName" :disabled="true"/>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-input v-model="systemDepartment.createTime" :disabled="true"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="systemDepartment.desc" :disabled="true"/>
        </el-form-item>
      </el-form>
    </el-dialog>
    <!-- 查看 -->

  </div>
</template>

<script>
  import httpClient from '@/utils/httpClient'

  export default {
    filters: {
      statusFilter(status) {
        const statusMap = {
          0: 'primary',
          1: 'warning',
        }
        return statusMap[status]
      }
    },
    data() {
      return {
        pageSizes: [10, 20, 30, 40], // 每页多少条
        pageSize: 10, // 每页多少条
        currentPage: 1, // 第几页
        totalCount: 0, // 总条数

        rules: {
          name: [{ required: true, message: '部门名称是必填项', trigger: 'blur' }],
        },

        defaultProps: {
          children: 'childDepartments',
          label: 'name',
          value: 'id',
        },

        SystemDepartmentStatusOptions: [
          {
            name:'上架',
            value: '0'
          },
          {
            name:'下架',
            value: '1'
          }
        ],

        listLoading: true,
        dialogDetailVisible: false,
        dialogAddAndEditVisible: false,
        isAddDialog: true,

        list: null,
        deptTreeList: [],

        systemDepartment: {
          id: undefined,
          name: '',
          pid: '',
          pids: '',
          desc: '',
        },

        selectedParentDeptIds:[],

        searchInfo:{
          title: '',
          status: '',
        },

      }
    },

    created() {
      this.loadSystemDepartmentList();
    },
    methods: {
      handleSeeButton(info) {
        this.systemDepartment = Object.assign({}, info) // copy obj
        this.dialogDetailVisible = true
      },
      handleCreateButton() {
        this.selectedParentDeptIds = [];
        this.systemDepartment = {
          id: undefined,
          name: '',
          pid: '',
          pids: '',
          desc: '',
        };
        this.isAddDialog = true;
        if (this.deptTreeList.length <= 0) {
          this.loadSystemDepartmentTreeList();
        } else {
          this.dialogAddAndEditVisible = true;
          this.$nextTick(() => {
            this.$refs['addAndEditForm'].clearValidate()
          })
        }
      },
      handleEditButton(info) {
        this.systemDepartment = Object.assign({}, info) // copy obj
        var tempDeptIds = this.systemDepartment.pids.split(',');
        if (tempDeptIds.length > 0 && tempDeptIds[0] == 0) {
          tempDeptIds.splice(0, 1);
        }
        var tempSelectedParentDeptIds = [];
        for (let i = 0; i < tempDeptIds.length; i++) {
          let tempDeptId = tempDeptIds[i];
          tempSelectedParentDeptIds.push(parseInt(tempDeptId));
        }
        this.selectedParentDeptIds = tempSelectedParentDeptIds;
        this.isAddDialog = false;
        if (this.deptTreeList.length <= 0) {
          this.loadSystemDepartmentTreeList();
        } else {
          this.dialogAddAndEditVisible = true;
          this.$nextTick(() => {
            this.$refs['addAndEditForm'].clearValidate()
          })
        }
      },
      handleDeleteButton(info) {
        this.$confirm('确认删除？')
          .then(_ => {
            var params = {
              ids: [info.id],
            }

            this.postDeleteSystemDepartment(params)
            done();
          })
          .catch(_ => {});
      },
      loadSystemDepartmentList() {
        this.listLoading = true
        var params = {
          index: this.currentPage,
          pageSize: this.pageSize,
          title: this.searchInfo.title,
          status: this.searchInfo.status,
        }
        // console.log("loadSystemDepartmentList params is : ", params);

        httpClient.post("/api/systemDepartment/pageList", params, true).then(response => {
          console.log("loadSystemDepartmentList response is : ", response);
          this.listLoading = false;
          this.list = response.data.records;
          this.totalCount = parseInt(response.data.total);
        }).catch(error => {
          this.listLoading = false;
        })
      },
      loadSystemDepartmentTreeList() {
        this.listLoading = true
        var params = {}

        httpClient.post("/api/systemDepartment/treeList", params, true).then(response => {
          console.log("loadSystemDepartmentTreeList response is : ", response);
          this.listLoading = false;
          this.deptTreeList = response.data;
          this.dialogAddAndEditVisible = true;
          this.$nextTick(() => {
            this.$refs['addAndEditForm'].clearValidate()
          })
        }).catch(error => {
          this.listLoading = false;
        })
      },
      postAddOrEditSystemDepartment() {
        this.$refs['addAndEditForm'].validate((valid) => {
          if (valid) {

            let pid = 0;
            if (this.selectedParentDeptIds.length > 0) {
              pid =  this.selectedParentDeptIds[this.selectedParentDeptIds.length - 1];
            }

            this.listLoading = true
            let params = {
              name: this.systemDepartment.name,
              pid: pid,
              desc: this.systemDepartment.desc,
            }

            let url = '';
            if (this.isAddDialog) {
              url = "/api/systemDepartment/add";
            } else {
              url = "/api/systemDepartment/update";
              params.id = this.systemDepartment.id;
            }

            console.log("postAddOrEditSystemDepartment params is : ", params);
            httpClient.post(url, params, true).then(response => {
              // console.log("postAddOrEditSystemDepartment response is : ", response);
              this.listLoading = false;
              if (response.code == 0) {
                this.dialogAddAndEditVisible = false
                this.loadSystemDepartmentList();
              }
            }).catch(error => {
              this.listLoading = false;
            })
          }
        })
      },
      postDeleteSystemDepartment(params) {
        // console.log("postDeleteSystemDepartment params is : ", params);
        this.listLoading = true
        httpClient.post("/api/systemDepartment/delete", params, true).then(response => {
          // console.log("postDeleteSystemDepartment response is : ", response);
          this.listLoading = false;
          if (response.code == 0) {
            this.loadSystemDepartmentList();
          }
        }).catch(error => {
          this.listLoading = false;
        })
      },
      handlePageSizeChange(val) {
        this.pageSize = val;
        this.loadSystemDepartmentList();
      },
      handlePageCurrentChange(val) {
        this.currentPage = val;
        this.loadSystemDepartmentList();
      }
    }
  }
</script>

<style scoped>
  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }
  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }
</style>
