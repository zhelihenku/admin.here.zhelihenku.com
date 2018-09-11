<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input placeholder="关键字" v-model="searchInfo.title" style="width: 200px;" class="filter-item"/>
      <el-select v-model="searchInfo.status" placeholder="请选择视频状态" clearable class="filter-item" style="width: 150px">
        <el-option v-for="item in systemRoleStatusOptions" :key="item.value" :label="item.name" :value="item.value"/>
      </el-select>
      <el-button class="filter-item" type="primary" icon="el-icon-search" @click="loadSystemRoleList">搜索</el-button>
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
      <el-table-column label="角色名称" prop="name"  align="center">
      </el-table-column>
      <el-table-column label="角色全称" prop="fullName" align="center">
      </el-table-column>
      <el-table-column label="所属部门" prop="departmentFullName" align="center">
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="180" align="center">
      </el-table-column>
      <el-table-column label="操作" width="350" align="center">
        <template slot-scope="scope" class="changeType">
          <el-button-group>
            <el-button type="primary" size="mini" @click="handleSetPermissionsButton(scope.row)">分配权限</el-button>
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
      <el-form ref="addAndEditForm" :rules="rules" :model="systemRole" label-position="left" label-width="80px" style="width: 400px; margin-left:50px;">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="systemRole.name"/>
        </el-form-item>
        <el-form-item label="上级角色" >
          <el-cascader :options="roleTreeList" :props="defaultRoleProps" v-model="selectedParentRoleIds" placeholder="请选择上级角色" change-on-select clearable></el-cascader>
        </el-form-item>
        <el-form-item label="所属部门" >
          <el-cascader :options="deptTreeList" :props="defaultDepartmentProps" v-model="selectedDeptIds" placeholder="请选择所属部门" change-on-select clearable></el-cascader>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="systemRole.desc"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogAddAndEditVisible = false">取消</el-button>
        <el-button v-if="isAddDialog" type="primary" @click="postAddOrEditSystemRole">添加</el-button>
        <el-button v-else type="primary" @click="postAddOrEditSystemRole">编辑</el-button>
      </div>
    </el-dialog>
    <!-- 新增&编辑 -->

    <!-- 分配权限 -->
    <el-dialog title="分配权限" :visible.sync="dialogSetPermissionVisible" width="300px">
      <el-tree
        :data="menuTreeList"
        show-checkbox
        default-expand-all
        ref="menuTree"
        node-key="id"
        :default-checked-keys="defaultMenuChecked"
        :props="defaultMenuProps">
      </el-tree>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogSetPermissionVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddRoleSetPermissionButton">添加</el-button>
      </div>
    </el-dialog>
    <!-- 分配权限 -->

    <!-- 查看 -->
    <el-dialog title="部门" :visible.sync="dialogDetailVisible">
      <el-form ref="dataForm" :model="systemRole" label-position="left" label-width="90px" style="width: 400px; margin-left:150px;">
        <el-form-item label="角色名称">
          <el-input v-model="systemRole.name" :disabled="true"/>
        </el-form-item>
        <el-form-item label="角色全称">
          <el-input v-model="systemRole.fullName" :disabled="true"/>
        </el-form-item>
        <el-form-item label="所属部门">
          <el-input v-model="systemRole.departmentFullName" :disabled="true"/>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-input v-model="systemRole.createTime" :disabled="true"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="systemRole.desc" :disabled="true"/>
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
        defaultMenuProps: {
          children: 'childMenus',
          label: 'name'
        },

        rules: {
          name: [{ required: true, message: '部门名称是必填项', trigger: 'blur' }],
        },

        systemRoleStatusOptions: [
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
        dialogSetPermissionVisible: false,
        isAddDialog: true,

        list: null,
        roleTreeList: [],
        deptTreeList: [],
        menuTreeList: [],
        systemRole: {
          id: undefined,
          name: '',
          pid: '',
          pids: '',
          desc: '',
        },
        selectedParentRoleIds: [],
        selectedDeptIds: [],
        defaultMenuChecked: []
      }
    },
    created() {
      this.loadSystemRoleList()
    },
    methods: {
      handleSeeButton(info) {
        this.systemRole = Object.assign({}, info) // copy obj
        this.dialogDetailVisible = true
      },
      handleCreateButton() {
        this.selectedParentRoleIds = [];
        this.selectedDeptIds = [];
        this.systemRole = {
          id: undefined,
          name: '',
          pid: '',
          desc: '',
        };
        this.isAddDialog = true;
        if (this.deptTreeList.length <= 0) {
          this.loadSystemRoleTreeList();
          this.loadSystemDepartmentTreeList();
        } else {
          this.dialogAddAndEditVisible = true;
          this.$nextTick(() => {
            this.$refs['addAndEditForm'].clearValidate()
          })
        }
      },
      handleEditButton(info) {
        this.systemRole = Object.assign({}, info) // copy obj

        var tempRoleIds = this.systemRole.pids.split(',');
        if (tempRoleIds.length > 0 && tempRoleIds[0] == 0) {
          tempRoleIds.splice(0, 1);
        }
        var tempSelectedParentRoleIds = [];
        for (let i = 0; i < tempRoleIds.length - 1; i++) {
          let tempRoleId = tempRoleIds[i];
          tempSelectedParentRoleIds.push(parseInt(tempRoleId));
        }
        this.selectedParentRoleIds = tempSelectedParentRoleIds;

        var tempDeptIds = this.systemRole.pids.split(',');
        if (tempDeptIds.length > 0 && tempDeptIds[0] == 0) {
          tempDeptIds.splice(0, 1);
        }
        var tempSelectedDeptIds = [];
        for (let i = 0; i < tempDeptIds.length - 1; i++) {
          let tempDeptId = tempDeptIds[i];
          tempSelectedDeptIds.push(parseInt(tempDeptId));
        }
        this.selectedDeptIds = tempSelectedDeptIds;

        this.isAddDialog = false;

        this.loadSystemRoleTreeList();
        this.loadSystemDepartmentTreeList();

        this.dialogAddAndEditVisible = true;
        this.$nextTick(() => {
          this.$refs['addAndEditForm'].clearValidate()
        })
      },
      handleSetPermissionsButton(info) {
        this.systemRole = Object.assign({}, info) // copy obj
        this.loadSystemMenuTreeList()
      },
      handleAddRoleSetPermissionButton() {

        var selectedMenuList = this.$refs.menuTree.getCheckedNodes();
        var halfSelectedMenuList = this.$refs.menuTree.getHalfCheckedNodes();

        selectedMenuList = selectedMenuList.concat(halfSelectedMenuList);

        console.log("selectedMenu is : ", selectedMenuList, halfSelectedMenuList)

        let menuIds = [];
        for (let i = 0; i < selectedMenuList.length; i++) {
          let menu = selectedMenuList[i];
          menuIds.push(menu.id);
        }

        let params = {
          roleId: this.systemRole.id,
          menuIds: menuIds,
        }

        this.postUpdateSystemRolePermissions(params);
      },
      handleDeleteButton(info) {
        this.$confirm('确认删除？')
          .then(_ => {
            var params = {
              ids: [info.id],
            }

            this.postDeleteSystemRole(params)
            done();
          })
          .catch(_ => {});
      },
      loadSystemRoleList() {
        this.listLoading = true
        var params = {
          index: this.currentPage,
          pageSize: this.pageSize,
          title: this.searchInfo.title,
          status: this.searchInfo.status,
        }
        // console.log("loadSystemRoleList params is : ", params);

        httpClient.post("/api/systemRole/pageList", params, true).then(response => {
          console.log("loadSystemRoleList response is : ", response);
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
          console.log("loadsystemRoleTreeList response is : ", response);
          this.listLoading = false;
          this.roleTreeList = response.data;
        }).catch(error => {
          this.listLoading = false;
        })
      },
      loadSystemMenuTreeList() {
        this.listLoading = true
        var params = {}

        httpClient.post("/api/systemMenu/treeList", params, true).then(response => {
          console.log("loadsystemMenuTreeList response is : ", response);
          if (response.code == 0) {
            this.listLoading = false;
            this.menuTreeList = response.data;
            this.dialogSetPermissionVisible = true;
          }
        }).catch(error => {
          this.listLoading = false;
        })
      },
      loadSystemDepartmentTreeList() {
        this.listLoading = true
        var params = {}

        httpClient.post("/api/systemDepartment/treeList", params, true).then(response => {
          console.log("loadsystemRoleTreeList response is : ", response);
          this.listLoading = false;
          this.deptTreeList = response.data;
        }).catch(error => {
          this.listLoading = false;
        })
      },
      postAddOrEditSystemRole() {
        this.$refs['addAndEditForm'].validate((valid) => {
          if (valid) {

            let pid = 0;
            if (this.selectedParentRoleIds.length > 0) {
              pid =  this.selectedParentRoleIds[this.selectedParentRoleIds.length - 1];
            }

            let departmentId = 0;
            if (this.selectedDeptIds.length > 0) {
              departmentId =  this.selectedDeptIds[this.selectedDeptIds.length - 1];
            }

            this.listLoading = true
            let params = {
              name: this.systemRole.name,
              pid: pid,
              departmentId: departmentId,
              desc: this.systemRole.desc,
            }

            let url = '';
            if (this.isAddDialog) {
              url = "/api/systemRole/add";
            } else {
              url = "/api/systemRole/update";
              params.id = this.systemRole.id;
            }

            console.log("postAddOrEditsystemRole params is : ", params);
            httpClient.post(url, params, true).then(response => {
              // console.log("postAddOrEditsystemRole response is : ", response);
              this.listLoading = false;
              if (response.code == 0) {
                this.dialogAddAndEditVisible = false
                this.loadSystemRoleList();
              }
            }).catch(error => {
              this.listLoading = false;
            })
          }
        })
      },
      postUpdateSystemRolePermissions(params) {
        console.log("postAddystemRolePermissions params is : ", params);
        this.listLoading = true
        httpClient.post("/api/systemRole/updatePermissions", params, true).then(response => {
          // console.log("postAddystemRolePermissions response is : ", response);
          this.listLoading = false;
          if (response.code == 0) {
            this.dialogSetPermissionVisible = false;
            this.loadSystemRoleList();
          }
        }).catch(error => {
          this.listLoading = false;
        })
      },
      postDeleteSystemRole(params) {
        // console.log("postDeletesystemRole params is : ", params);
        this.listLoading = true
        httpClient.post("/api/systemRole/delete", params, true).then(response => {
          // console.log("postDeletesystemRole response is : ", response);
          this.listLoading = false;
          if (response.code == 0) {
            this.loadSystemRoleList();
          }
        }).catch(error => {
          this.listLoading = false;
        })
      },
      handlePageSizeChange(val) {
        this.pageSize = val;
        this.loadSystemRoleList();
      },
      handlePageCurrentChange(val) {
        this.currentPage = val;
        this.loadSystemRoleList();
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
