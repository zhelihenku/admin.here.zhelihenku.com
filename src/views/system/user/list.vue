<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input placeholder="关键字" v-model="searchInfo.title" style="width: 200px;" class="filter-item"/>
      <el-select v-model="searchInfo.status" placeholder="请选择视频状态" clearable class="filter-item" style="width: 150px">
        <el-option v-for="item in systemUserStatusOptions" :key="item.value" :label="item.name" :value="item.value"/>
      </el-select>
      <el-button class="filter-item" type="primary" icon="el-icon-search" @click="loadSystemUserList">搜索</el-button>
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
      <el-table-column label="昵称" prop="name"  align="center">
      </el-table-column>
      <el-table-column label="账号" prop="account" align="center">
      </el-table-column>
      <el-table-column label="角色" prop="roleId" align="center">
      </el-table-column>
      <el-table-column label="所属部门" prop="departmentId" align="center">
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="180" align="center">
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
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
    <el-dialog title="角色" :visible.sync="dialogAddAndEditVisible">
      <el-form ref="addAndEditForm" :rules="rules" :model="systemUser" label-position="left" label-width="80px" style="width: 400px; margin-left:50px;">
        <el-form-item label="用户名称" prop="name">
          <el-input v-model="systemUser.name"/>
        </el-form-item>
        <el-form-item label="用户账号" prop="account">
          <el-input v-model="systemUser.account"/>
        </el-form-item>
        <el-form-item v-if="isAddDialog" label="用户密码" prop="password" auto-complete="off">
          <el-input type="password" v-model="systemUser.password"/>
        </el-form-item>
        <el-form-item v-if="isAddDialog" label="确认密码" prop="confirmPassword" auto-complete="off">
          <el-input type="password" v-model="systemUser.confirmPassword"/>
        </el-form-item>
        <el-form-item label="上级角色" prop="selectedRoleIds">
          <el-cascader :options="roleTreeList" :props="defaultRoleProps" v-model="systemUser.selectedRoleIds" placeholder="请选择上级角色" change-on-select clearable></el-cascader>
        </el-form-item>
        <el-form-item label="所属部门" prop="selectedDeptIds" >
          <el-cascader :options="deptTreeList" :props="defaultDepartmentProps" v-model="systemUser.selectedDeptIds" placeholder="请选择所属部门" change-on-select clearable></el-cascader>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogAddAndEditVisible = false">取消</el-button>
        <el-button v-if="isAddDialog" type="primary" @click="postAddOrEditSystemUser">添加</el-button>
        <el-button v-else type="primary" @click="postAddOrEditSystemUser">编辑</el-button>
      </div>
    </el-dialog>
    <!-- 新增&编辑 -->

    <!-- 查看 -->
    <el-dialog title="部门" :visible.sync="dialogDetailVisible">
      <el-form ref="dataForm" :model="systemUser" label-position="left" label-width="90px" style="width: 400px; margin-left:150px;">
        <el-form-item label="角色名称">
          <el-input v-model="systemUser.name" :disabled="true"/>
        </el-form-item>
        <el-form-item label="角色全称">
          <el-input v-model="systemUser.fullName" :disabled="true"/>
        </el-form-item>
        <el-form-item label="所属部门">
          <el-input v-model="systemUser.departmentFullName" :disabled="true"/>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-input v-model="systemUser.createTime" :disabled="true"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="systemUser.desc" :disabled="true"/>
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

      var validatePass = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入密码'));
        } else {
          if (this.systemUser.confirmPassword !== '') {
            this.$refs.addAndEditForm.validateField('confirmPassword');
          }
          callback();
        }
      };
      var validatePass2 = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请再次输入密码'));
        } else if (value !== this.systemUser.password) {
          callback(new Error('两次输入密码不一致!'));
        } else {
          callback();
        }
      };

      return {
        pageSizes: [10, 20, 30, 40], // 每页多少条
        pageSize: 10, // 每页多少条
        currentPage: 1, // 第几页
        totalCount: 0, // 总条数

        defaultDepartmentProps: {
          children: 'childDepartments',
          label: 'name',
          value: 'id',
        },
        defaultRoleProps: {
          children: 'childRoles',
          label: 'name',
          value: 'id',
        },

        ruleForm2: {
          password: '',
          confirmPassword: '',
        },
        rules: {
          password: [
            { validator: validatePass, trigger: 'blur' }
          ],
          confirmPassword: [
            { validator: validatePass2, trigger: 'blur' }
          ],
          name: [{ required: true, message: '用户昵称是必填项', trigger: 'blur' }],
          account: [{ required: true, message: '用户账号是必填项', trigger: 'blur' }],
          selectedRoleIds: [{ required: true, message: '角色是必填项', type: 'array', trigger: 'change' }],
          selectedDeptIds: [{ required: true, message: '部门是必填项', type: 'array', trigger: 'change' }],
        },

        systemUserStatusOptions: [
          {
            name:'上架',
            value: '0'
          },
          {
            name:'下架',
            value: '1'
          }
        ],

        searchInfo:{
          title: '',
          status: '',
        },

        listLoading: true,
        dialogDetailVisible: false,
        dialogAddAndEditVisible: false,
        isAddDialog: true,

        list: null,
        roleTreeList: [],
        deptTreeList: [],
        systemUser: {
          id: undefined,
          name: '',
          account: '',
          password: '',
          confirmPassword: '',
          selectedRoleIds: [],
          selectedDeptIds: [],
        },
      }
    },
    created() {
      this.loadSystemUserList()
    },
    methods: {
      handleSeeButton(info) {
        this.systemUser = Object.assign({}, info) // copy obj
        this.dialogDetailVisible = true
      },
      handleCreateButton() {
        this.systemUser = {
          id: undefined,
          name: '',
          account: '',
          password: '',
          confirmPassword: '',
          selectedRoleIds: [],
          selectedDeptIds: [],
        };
        this.isAddDialog = true;
        this.loadSystemRoleTreeList();
        this.loadSystemDepartmentTreeList();
        this.dialogAddAndEditVisible = true;
        this.$nextTick(() => {
          this.$refs['addAndEditForm'].clearValidate()
        })
      },
      handleEditButton(info) {
        this.systemUser = Object.assign({}, info) // copy obj

        var tempSelectedRoleIds = [];
        // var tempRoleIds = this.systemUser.roleIds.split(',');
        // if (tempRoleIds.length > 0 && tempRoleIds[0] == 0) {
        //   tempRoleIds.splice(0, 1);
        // }
        // for (let i = 0; i < tempRoleIds.length - 1; i++) {
        //   let tempRoleId = tempRoleIds[i];
        //   tempSelectedRoleIds.push(parseInt(tempRoleId));
        // }
        this.systemUser.selectedRoleIds = tempSelectedRoleIds;

        var tempSelectedDeptIds = [];
        // var tempDeptIds = this.systemUser.departmentIds.split(',');
        // if (tempDeptIds.length > 0 && tempDeptIds[0] == 0) {
        //   tempDeptIds.splice(0, 1);
        // }
        // for (let i = 0; i < tempDeptIds.length - 1; i++) {
        //   let tempDeptId = tempDeptIds[i];
        //   tempSelectedDeptIds.push(parseInt(tempDeptId));
        // }
        this.systemUser.selectedDeptIds = tempSelectedDeptIds;

        this.isAddDialog = false;

        this.loadSystemRoleTreeList();
        this.loadSystemDepartmentTreeList();

        this.dialogAddAndEditVisible = true;
        this.$nextTick(() => {
          this.$refs['addAndEditForm'].clearValidate()
        })
      },
      handleDeleteButton(info) {
        this.$confirm('确认删除？')
          .then(_ => {
            var params = {
              ids: [info.id],
            }

            this.postDeletesystemUser(params)
            done();
          })
          .catch(_ => {});
      },
      loadSystemUserList() {
        this.listLoading = true
        var params = {
          index: this.currentPage,
          pageSize: this.pageSize,
          title: this.searchInfo.title,
          status: this.searchInfo.status,
        }
        // console.log("loadSystemUserList params is : ", params);

        httpClient.post("/api/systemUser/pageList", params, true).then(response => {
          console.log("loadSystemUserList response is : ", response);
          this.listLoading = false;
          this.list = response.data.records;
          this.totalCount = parseInt(response.data.total);
        }).catch(error => {
          this.listLoading = false;
        })
      },
      loadSystemRoleTreeList() {
        this.listLoading = true
        var params = {}

        httpClient.post("/api/systemRole/treeList", params, true).then(response => {
          console.log("loadSystemRoleTreeList response is : ", response);
          this.listLoading = false;
          this.roleTreeList = response.data;
        }).catch(error => {
          this.listLoading = false;
        })
      },
      loadSystemDepartmentTreeList() {
        this.listLoading = true
        var params = {}

        httpClient.post("/api/systemDepartment/treeList", params, true).then(response => {
          console.log("loadsystemUserTreeList response is : ", response);
          this.listLoading = false;
          this.deptTreeList = response.data;
        }).catch(error => {
          this.listLoading = false;
        })
      },
      postAddOrEditSystemUser() {
        this.$refs['addAndEditForm'].validate((valid) => {
          if (valid) {

            let roleId = 0;
            if (this.systemUser.selectedRoleIds.length > 0) {
              roleId =  this.systemUser.selectedRoleIds[this.systemUser.selectedRoleIds.length - 1];
            }

            let departmentId = 0;
            if (this.systemUser.selectedDeptIds.length > 0) {
              departmentId =  this.systemUser.selectedDeptIds[this.systemUser.selectedDeptIds.length - 1];
            }

            this.listLoading = true
            let params = {
              name: this.systemUser.name,
              account: this.systemUser.account,
              roleId: roleId,
              departmentId: departmentId,
            }

            let url = '';
            if (this.isAddDialog) {
              url = "/api/systemUser/add";
              params.password = this.systemUser.password;
            } else {
              url = "/api/systemUser/update";
              params.id = this.systemUser.id;
            }

            console.log("postAddOrEditsystemUser params is : ", params);
            httpClient.post(url, params, true).then(response => {
              // console.log("postAddOrEditsystemUser response is : ", response);
              this.listLoading = false;
              if (response.code == 0) {
                this.dialogAddAndEditVisible = false
                this.loadSystemUserList();
              }
            }).catch(error => {
              this.listLoading = false;
            })
          }
        })
      },
      postDeletesystemUser(params) {
        // console.log("postDeletesystemUser params is : ", params);
        this.listLoading = true
        httpClient.post("/api/systemUser/delete", params, true).then(response => {
          // console.log("postDeletesystemUser response is : ", response);
          this.listLoading = false;
          if (response.code == 0) {
            this.loadSystemUserList();
          }
        }).catch(error => {
          this.listLoading = false;
        })
      },
      handlePageSizeChange(val) {
        this.pageSize = val;
        this.loadSystemUserList();
      },
      handlePageCurrentChange(val) {
        this.currentPage = val;
        this.loadSystemUserList();
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
